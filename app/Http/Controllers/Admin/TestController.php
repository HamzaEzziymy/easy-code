<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\LicenseCategory;
use App\Models\Question;
use App\Models\Test;
use App\Models\TestQuestion;
use Illuminate\Database\QueryException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class TestController extends Controller
{
    public function index(Request $request): Response
    {
        $categoryId = $this->categoryId($request);
        $status     = $this->choice($request, 'status', ['draft', 'published', 'archived']);
        $search     = trim((string) $request->query('search', ''));

        $tests = Test::query()
            ->with('licenseCategory')
            ->withCount('questions')
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
            ->through(fn (Test $test) => $this->present($test));

        return Inertia::render('Tests/Index', [
            'tests'      => $tests,
            'filters'    => [
                'search'   => $search,
                'category' => $categoryId,
                'status'   => $status,
            ],
            'stats'      => [
                'total'     => Test::count(),
                'published' => Test::where('status', 'published')->count(),
                'draft'     => Test::where('status', 'draft')->count(),
            ],
            'categories' => $this->categoriesList(),
            'questions'  => $this->questionsList(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validateRequest($request);

        DB::transaction(function () use ($request, $data) {
            $test = new Test($data['fields']);
            $test->created_by = $request->user()->id;
            $test->cover_path = $this->storeFile($request, 'cover', 'tests/covers');
            $test->save();

            $this->syncQuestions($test, $data['question_ids']);
        });

        return redirect()->route('tests.index')->with('success', 'created');
    }

    public function update(Request $request, Test $test): RedirectResponse
    {
        $data = $this->validateRequest($request, $test);

        DB::transaction(function () use ($request, $test, $data) {
            $test->fill($data['fields']);
            $this->applyFile($request, $test, 'cover', 'cover_path', 'tests/covers');
            $test->save();

            $this->syncQuestions($test, $data['question_ids']);
        });

        return redirect()->route('tests.index')->with('success', 'updated');
    }

    public function destroy(Test $test): RedirectResponse
    {
        try {
            $test->delete();
        } catch (QueryException) {
            return back()->withErrors(['tests' => 'This test cannot be deleted.']);
        }

        if ($test->cover_path) {
            Storage::disk('local')->delete($test->cover_path);
        }

        return redirect()->route('tests.index')->with('success', 'deleted');
    }

    public function file(Test $test, string $slot)
    {
        abort_unless($slot === 'cover', 404);

        $path = $test->cover_path;

        if ($path === null || ! Storage::disk('local')->exists($path)) {
            abort(404);
        }

        return response()->file(Storage::disk('local')->path($path));
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    private function validateRequest(Request $request, ?Test $test = null): array
    {
        $validated = $request->validate([
            'license_category_id' => ['required', 'integer', Rule::exists(LicenseCategory::class, 'id')],
            'name_fr'             => ['required', 'string', 'max:200'],
            'name_ar'             => ['required', 'string', 'max:200'],
            'description_fr'      => ['nullable', 'string', 'max:5000'],
            'description_ar'      => ['nullable', 'string', 'max:5000'],
            'duration_minutes'    => ['required', 'integer', 'min:1', 'max:300'],
            'pass_percentage'     => ['required', 'numeric', 'min:0', 'max:100'],
            'status'              => ['required', Rule::in(['draft', 'published', 'archived'])],
            'question_ids'        => ['nullable', 'array'],
            'question_ids.*'      => ['integer', Rule::exists(Question::class, 'id')],
            'cover'               => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
            'remove_cover'        => ['boolean'],
        ]);

        return [
            'fields' => [
                'license_category_id' => $validated['license_category_id'],
                'name_fr'             => $validated['name_fr'],
                'name_ar'             => $validated['name_ar'],
                'description_fr'      => $validated['description_fr'] ?? null,
                'description_ar'      => $validated['description_ar'] ?? null,
                'duration_minutes'    => $validated['duration_minutes'],
                'pass_percentage'     => $validated['pass_percentage'],
                'status'              => $validated['status'],
            ],
            'question_ids' => $validated['question_ids'] ?? [],
        ];
    }

    private function syncQuestions(Test $test, array $questionIds): void
    {
        TestQuestion::where('test_id', $test->id)->delete();

        foreach (array_values($questionIds) as $order => $questionId) {
            TestQuestion::create([
                'test_id'        => $test->id,
                'question_id'    => $questionId,
                'question_order' => $order + 1,
                'points'         => 1,
            ]);
        }
    }

    private function present(Test $test): array
    {
        return [
            'id'             => $test->id,
            'nameFr'         => $test->name_fr,
            'nameAr'         => $test->name_ar,
            'descriptionFr'  => $test->description_fr,
            'descriptionAr'  => $test->description_ar,
            'status'         => $test->status,
            'duration'       => $test->duration_minutes,
            'passPercentage' => $test->pass_percentage,
            'questionsCount' => (int) $test->questions_count,
            'categoryId'     => $test->license_category_id,
            'categoryCode'   => $test->licenseCategory?->code,
            'categoryFr'     => $test->licenseCategory?->name_fr,
            'categoryAr'     => $test->licenseCategory?->name_ar,
            'coverUrl'       => $this->fileUrl($test),
            'createdAt'      => $test->created_at?->toDateString(),
        ];
    }

    private function fileUrl(Test $test): ?string
    {
        return $test->cover_path === null
            ? null
            : route('tests.file', [$test, 'cover']).'?v='.$test->updated_at->timestamp;
    }

    private function storeFile(Request $request, string $input, string $dir): ?string
    {
        $file = $request->file($input);

        return $file instanceof UploadedFile ? $file->store($dir, 'local') : null;
    }

    private function applyFile(Request $request, Test $test, string $input, string $column, string $dir): void
    {
        if ($request->boolean('remove_'.$input)) {
            $this->deleteFile($test, $column);

            return;
        }

        $path = $this->storeFile($request, $input, $dir);

        if ($path !== null) {
            $this->deleteFile($test, $column);
            $test->{$column} = $path;
        }
    }

    private function deleteFile(Test $test, string $column): void
    {
        if ($test->{$column} !== null) {
            Storage::disk('local')->delete($test->{$column});
        }

        $test->{$column} = null;
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

    private function questionsList(): array
    {
        return Question::query()
            ->where('is_active', true)
            ->with(['translations', 'licenseCategory'])
            ->get()
            ->map(fn (Question $q) => [
                'id'          => $q->id,
                'textFr'      => $q->textFor('fr'),
                'textAr'      => $q->textFor('ar'),
                'categoryId'  => $q->license_category_id,
                'categoryCode' => $q->licenseCategory?->code,
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
