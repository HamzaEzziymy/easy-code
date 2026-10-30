<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\LicenseCategory;
use Illuminate\Database\QueryException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CourseController extends Controller
{
    public function index(Request $request): Response
    {
        $categoryId = $this->categoryId($request);
        $status     = $this->choice($request, 'status', ['draft', 'published', 'archived']);
        $search     = trim((string) $request->query('search', ''));

        $courses = Course::query()
            ->with('licenseCategory')
            ->when($search !== '', function ($query) use ($search) {
                $like = '%'.str_replace(['%', '_'], ['\%', '\_'], $search).'%';
                $query->where(fn ($q) => $q
                    ->where('name_fr', 'like', $like)
                    ->orWhere('name_ar', 'like', $like));
            })
            ->when($categoryId, fn ($q) => $q->where('license_category_id', $categoryId))
            ->when($status, fn ($q) => $q->where('status', $status))
            ->latest()
            ->paginate(12)
            ->withQueryString()
            ->through(fn (Course $course) => $this->present($course));

        return Inertia::render('Courses/Index', [
            'courses'    => $courses,
            'filters'    => [
                'search'   => $search,
                'category' => $categoryId,
                'status'   => $status,
            ],
            'stats'      => [
                'total'     => Course::count(),
                'published' => Course::where('status', 'published')->count(),
                'draft'     => Course::where('status', 'draft')->count(),
            ],
            'categories' => $this->categoriesList(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validate($request);

        $course = new Course($data['fields']);
        $course->created_by = $request->user()->id;
        $course->cover_path  = $this->storeFile($request, 'cover', 'courses/covers');
        $course->pdf_ar_path = $this->storeFile($request, 'pdf_ar', 'courses/pdfs');
        $course->pdf_fr_path = $this->storeFile($request, 'pdf_fr', 'courses/pdfs');
        $course->save();

        return redirect()->route('courses.index')->with('success', 'created');
    }

    public function update(Request $request, Course $course): RedirectResponse
    {
        $data = $this->validate($request, $course);
        $course->fill($data['fields']);

        $this->applyFile($request, $course, 'cover',  'cover_path',  'courses/covers');
        $this->applyFile($request, $course, 'pdf_ar', 'pdf_ar_path', 'courses/pdfs');
        $this->applyFile($request, $course, 'pdf_fr', 'pdf_fr_path', 'courses/pdfs');

        $course->save();

        return redirect()->route('courses.index')->with('success', 'updated');
    }

    public function destroy(Course $course): RedirectResponse
    {
        try {
            $course->delete();
        } catch (QueryException) {
            return back()->withErrors(['courses' => 'This course cannot be deleted.']);
        }

        foreach (['cover_path', 'pdf_ar_path', 'pdf_fr_path'] as $slot) {
            if ($course->{$slot}) {
                Storage::disk('local')->delete($course->{$slot});
            }
        }

        return redirect()->route('courses.index')->with('success', 'deleted');
    }

    /** Serve a private file (cover image or PDF) to authenticated admins only. */
    public function file(Course $course, string $slot)
    {
        abort_unless(in_array($slot, ['cover', 'pdf_ar', 'pdf_fr'], true), 404);

        $column = $slot === 'cover' ? 'cover_path' : $slot.'_path';
        $path   = $course->{$column};

        if ($path === null || ! Storage::disk('local')->exists($path)) {
            abort(404);
        }

        return response()->file(Storage::disk('local')->path($path));
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    private function validate(Request $request, ?Course $course = null): array
    {
        $validated = $request->validate([
            'license_category_id' => ['required', 'integer', Rule::exists(LicenseCategory::class, 'id')],
            'name_fr'             => ['required', 'string', 'max:200'],
            'name_ar'             => ['required', 'string', 'max:200'],
            'description_fr'      => ['nullable', 'string', 'max:5000'],
            'description_ar'      => ['nullable', 'string', 'max:5000'],
            'status'              => ['required', Rule::in(['draft', 'published', 'archived'])],
            'cover'               => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
            'pdf_ar'              => ['nullable', 'file', 'mimes:pdf', 'max:20480'],
            'pdf_fr'              => ['nullable', 'file', 'mimes:pdf', 'max:20480'],
            'remove_cover'        => ['boolean'],
            'remove_pdf_ar'       => ['boolean'],
            'remove_pdf_fr'       => ['boolean'],
        ]);

        return [
            'fields' => [
                'license_category_id' => $validated['license_category_id'],
                'name_fr'             => $validated['name_fr'],
                'name_ar'             => $validated['name_ar'],
                'description_fr'      => $validated['description_fr'] ?? null,
                'description_ar'      => $validated['description_ar'] ?? null,
                'status'              => $validated['status'],
            ],
            'validated' => $validated,
        ];
    }

    private function present(Course $course): array
    {
        return [
            'id'            => $course->id,
            'nameFr'        => $course->name_fr,
            'nameAr'        => $course->name_ar,
            'descriptionFr' => $course->description_fr,
            'descriptionAr' => $course->description_ar,
            'status'        => $course->status,
            'categoryId'    => $course->license_category_id,
            'categoryCode'  => $course->licenseCategory?->code,
            'categoryFr'    => $course->licenseCategory?->name_fr,
            'categoryAr'    => $course->licenseCategory?->name_ar,
            'coverUrl'      => $this->fileUrl($course, 'cover'),
            'pdfArUrl'      => $this->fileUrl($course, 'pdf_ar'),
            'pdfFrUrl'      => $this->fileUrl($course, 'pdf_fr'),
            'createdAt'     => $course->created_at?->toDateString(),
        ];
    }

    private function fileUrl(Course $course, string $slot): ?string
    {
        $column = $slot === 'cover' ? 'cover_path' : $slot.'_path';

        return $course->{$column} === null
            ? null
            : route('courses.file', [$course, $slot]).'?v='.$course->updated_at->timestamp;
    }

    private function storeFile(Request $request, string $input, string $dir): ?string
    {
        $file = $request->file($input);

        return $file instanceof UploadedFile ? $file->store($dir, 'local') : null;
    }

    private function applyFile(Request $request, Course $course, string $input, string $column, string $dir): void
    {
        $removeKey = 'remove_'.$input;

        if ($request->boolean($removeKey)) {
            $this->deleteFile($course, $column);

            return;
        }

        $path = $this->storeFile($request, $input, $dir);

        if ($path !== null) {
            $this->deleteFile($course, $column);
            $course->{$column} = $path;
        }
    }

    private function deleteFile(Course $course, string $column): void
    {
        if ($course->{$column} !== null) {
            Storage::disk('local')->delete($course->{$column});
        }

        $course->{$column} = null;
    }

    private function categoriesList(): array
    {
        return LicenseCategory::query()
            ->orderBy('code')
            ->get(['id', 'code', 'name_ar', 'name_fr'])
            ->map(fn (LicenseCategory $c) => [
                'id'     => $c->id,
                'code'   => $c->code,
                'nameAr' => $c->name_ar,
                'nameFr' => $c->name_fr,
            ])
            ->all();
    }

    private function categoryId(Request $request): ?string
    {
        $value = $request->query('category');

        return $value !== null && ctype_digit((string) $value) ? (string) $value : null;
    }

    private function choice(Request $request, string $key, array $allowed): ?string
    {
        $value = $request->query($key);

        return in_array($value, $allowed, true) ? $value : null;
    }
}
