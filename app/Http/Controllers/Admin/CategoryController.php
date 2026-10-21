<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\LicenseCategory;
use App\Models\Student;
use Illuminate\Database\QueryException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CategoryController extends Controller
{
    public function index(Request $request): Response
    {
        return Inertia::render('Categories/Index', [
            'categories' => $this->query($request)->get()->map(fn (LicenseCategory $category) => $this->present($category)),
            'filters' => [
                'search' => (string) $request->query('search', ''),
                'status' => $this->choice($request, 'status', ['active', 'inactive']),
            ],
            'stats' => [
                'total' => LicenseCategory::count(),
                'active' => LicenseCategory::where('is_active', true)->count(),
                'trainees' => Student::count(),
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Categories/Form', ['category' => null]);
    }

    public function edit(LicenseCategory $category): Response
    {
        return Inertia::render('Categories/Form', ['category' => $this->present($category)]);
    }

    public function store(Request $request): RedirectResponse
    {
        $category = new LicenseCategory($this->data($request));
        $category->icon_path = $this->storeIcon($request);
        $category->save();

        return redirect()->route('categories.index')->with('success', 'created');
    }

    public function update(Request $request, LicenseCategory $category): RedirectResponse
    {
        $category->fill($this->data($request, $category));
        $category->save();
        $this->applyIcon($request, $category);

        return redirect()->route('categories.index')->with('success', 'updated');
    }

    public function toggleActive(LicenseCategory $category): RedirectResponse
    {
        $wasActive = $category->is_active;
        $category->update(['is_active' => ! $wasActive]);

        return back()->with('success', $wasActive ? 'deactivated' : 'activated');
    }

    public function destroy(LicenseCategory $category): RedirectResponse
    {
        try {
            $category->delete();
        } catch (QueryException) {
            return back()->withErrors(['categories' => 'This category is used by trainees, exams or questions. Deactivate it instead.']);
        }

        $this->deleteIcon($category);

        return redirect()->route('categories.index')->with('success', 'deleted');
    }

    /**
     * Served instead of a public symlink so the icon only loads for a signed-in administrator.
     */
    public function icon(LicenseCategory $category)
    {
        if ($category->icon_path === null || ! Storage::disk('local')->exists($category->icon_path)) {
            abort(404);
        }

        return response()->file(Storage::disk('local')->path($category->icon_path));
    }

    private function query(Request $request)
    {
        $search = trim((string) $request->query('search', ''));
        $status = $this->choice($request, 'status', ['active', 'inactive']);

        return LicenseCategory::query()
            ->withCount(['students', 'exams', 'questions'])
            ->when($search !== '', function ($query) use ($search) {
                $like = '%'.str_replace(['%', '_'], ['\%', '\_'], $search).'%';

                $query->where(fn ($inner) => $inner
                    ->where('code', 'like', $like)
                    ->orWhere('name_fr', 'like', $like)
                    ->orWhere('name_ar', 'like', $like));
            })
            ->when($status, fn ($query) => $query->where('is_active', $status === 'active'))
            ->orderBy('code');
    }

    private function data(Request $request, ?LicenseCategory $category = null): array
    {
        // The code is stored upper-cased, so normalise before validating: the unique rule
        // has to compare against the value that will actually be written.
        $request->merge(['code' => mb_strtoupper(trim((string) $request->input('code', '')))]);

        $validated = $request->validate([
            'code' => [
                'required', 'string', 'max:20',
                Rule::unique(LicenseCategory::class, 'code')->ignore($category?->id),
            ],
            'name_fr' => ['required', 'string', 'max:100'],
            'name_ar' => ['required', 'string', 'max:100'],
            'condition_fr' => ['nullable', 'string', 'max:1000'],
            'condition_ar' => ['nullable', 'string', 'max:1000'],
            'icon' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'remove_icon' => ['boolean'],
            'is_active' => ['boolean'],
        ]);

        $data = [
            'code' => $validated['code'],
            'name_fr' => $validated['name_fr'],
            'name_ar' => $validated['name_ar'],
            'description_fr' => $validated['condition_fr'] ?? null,
            'description_ar' => $validated['condition_ar'] ?? null,
        ];

        // Availability is switched from the list, so an edit that never mentions it keeps the flag as is.
        if (array_key_exists('is_active', $validated)) {
            $data['is_active'] = $request->boolean('is_active');
        }

        return $data;
    }

    private function present(LicenseCategory $category): array
    {
        return [
            'id' => $category->id,
            'code' => $category->code,
            'nameFr' => $category->name_fr,
            'nameAr' => $category->name_ar,
            'conditionFr' => $category->description_fr,
            'conditionAr' => $category->description_ar,
            'iconUrl' => $this->iconUrl($category),
            'isActive' => $category->is_active,
            'studentsCount' => $category->students_count ?? $category->students()->count(),
            'examsCount' => $category->exams_count ?? $category->exams()->count(),
            'questionsCount' => $category->questions_count ?? $category->questions()->count(),
        ];
    }

    private function storeIcon(Request $request): ?string
    {
        $file = $request->file('icon');

        return $file instanceof UploadedFile ? $file->store('categories', 'local') : null;
    }

    private function applyIcon(Request $request, LicenseCategory $category): void
    {
        if ($request->boolean('remove_icon')) {
            $this->deleteIcon($category);
            $category->save();

            return;
        }

        $path = $this->storeIcon($request);

        if ($path !== null) {
            $this->deleteIcon($category);
            $category->icon_path = $path;
            $category->save();
        }
    }

    private function deleteIcon(LicenseCategory $category): void
    {
        if ($category->icon_path !== null) {
            Storage::disk('local')->delete($category->icon_path);
        }

        $category->icon_path = null;
    }

    private function iconUrl(LicenseCategory $category): ?string
    {
        return $category->icon_path === null
            ? null
            : route('categories.icon', $category).'?v='.$category->updated_at->timestamp;
    }

    private function choice(Request $request, string $key, array $allowed): ?string
    {
        $value = $request->query($key);

        return in_array($value, $allowed, true) ? $value : null;
    }
}
