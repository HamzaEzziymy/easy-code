<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Exam;
use App\Models\ExamQuestion;
use App\Models\LicenseCategory;
use App\Models\Question;
use Illuminate\Database\QueryException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\UploadedFile;
use Illuminate\Validation\Rule;

class ExamController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $data = $this->validateRequest($request);

        $exam = null;

        DB::transaction(function () use ($request, $data, &$exam) {
            $exam = new Exam($data['fields']);
            $exam->created_by = $request->user()->id;
            $exam->cover_path = $this->storeFile($request, 'cover', 'exams/covers');
            $exam->save();

            $this->syncQuestions($exam, $data['question_ids']);
        });

        return redirect()->route('exams.category', $exam->license_category_id)->with('success', 'created');
    }

    public function update(Request $request, Exam $exam): RedirectResponse
    {
        $data = $this->validateRequest($request, $exam);

        DB::transaction(function () use ($request, $exam, $data) {
            $exam->fill($data['fields']);
            $this->applyFile($request, $exam, 'cover', 'cover_path', 'exams/covers');
            $exam->save();

            $this->syncQuestions($exam, $data['question_ids']);
        });

        return redirect()->route('exams.category', $exam->license_category_id)->with('success', 'updated');
    }

    public function destroy(Exam $exam): RedirectResponse
    {
        $categoryId = $exam->license_category_id;

        try {
            $exam->delete();
        } catch (QueryException) {
            return back()->withErrors(['exams' => 'This exam cannot be deleted.']);
        }

        if ($exam->cover_path) {
            Storage::disk('local')->delete($exam->cover_path);
        }

        return redirect()->route('exams.category', $categoryId)->with('success', 'deleted');
    }

    public function file(Exam $exam, string $slot)
    {
        abort_unless($slot === 'cover', 404);

        $path = $exam->cover_path;

        if ($path === null || ! Storage::disk('local')->exists($path)) {
            abort(404);
        }

        return response()->file(Storage::disk('local')->path($path));
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    private function validateRequest(Request $request, ?Exam $exam = null): array
    {
        $validated = $request->validate([
            'license_category_id' => ['required', 'integer', Rule::exists(LicenseCategory::class, 'id')],
            'title_fr'            => ['required', 'string', 'max:200'],
            'title_ar'            => ['required', 'string', 'max:200'],
            'description'         => ['nullable', 'string', 'max:5000'],
            'description_ar'      => ['nullable', 'string', 'max:5000'],
            'duration_minutes'    => ['required', 'integer', 'min:1', 'max:300'],
            'status'              => ['required', Rule::in(['draft', 'published', 'archived'])],
            'question_ids'        => ['nullable', 'array'],
            'question_ids.*'      => ['integer', Rule::exists(Question::class, 'id')],
            'cover'               => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
            'remove_cover'        => ['boolean'],
        ]);

        return [
            'fields' => [
                'license_category_id' => $validated['license_category_id'],
                'title_fr'            => $validated['title_fr'],
                'title_ar'            => $validated['title_ar'],
                'description'         => $validated['description'] ?? null,
                'description_ar'      => $validated['description_ar'] ?? null,
                'duration_minutes'    => $validated['duration_minutes'],
                'status'              => $validated['status'],
            ],
            'question_ids' => $validated['question_ids'] ?? [],
        ];
    }

    private function syncQuestions(Exam $exam, array $questionIds): void
    {
        ExamQuestion::where('exam_id', $exam->id)->delete();

        foreach (array_values($questionIds) as $order => $questionId) {
            ExamQuestion::create([
                'exam_id'        => $exam->id,
                'question_id'    => $questionId,
                'question_order' => $order + 1,
                'points'         => 1,
            ]);
        }
    }

    private function storeFile(Request $request, string $input, string $dir): ?string
    {
        $file = $request->file($input);

        return $file instanceof UploadedFile ? $file->store($dir, 'local') : null;
    }

    private function applyFile(Request $request, Exam $exam, string $input, string $column, string $dir): void
    {
        if ($request->boolean('remove_' . $input)) {
            $this->deleteFile($exam, $column);

            return;
        }

        $path = $this->storeFile($request, $input, $dir);

        if ($path !== null) {
            $this->deleteFile($exam, $column);
            $exam->{$column} = $path;
        }
    }

    private function deleteFile(Exam $exam, string $column): void
    {
        if ($exam->{$column} !== null) {
            Storage::disk('local')->delete($exam->{$column});
        }

        $exam->{$column} = null;
    }
}
