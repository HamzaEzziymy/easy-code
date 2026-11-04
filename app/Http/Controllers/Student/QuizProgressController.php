<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Exam;
use App\Models\StudentQuizProgress;
use App\Models\Test;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class QuizProgressController extends Controller
{
    /**
     * Save (upsert) the trainee's sitting so it follows the account, not the browser.
     *
     * POST /student/progress
     */
    public function save(Request $request): JsonResponse
    {
        $student = $request->user()->studentProfile()->first();

        abort_unless($student !== null, 403);

        $data = $request->validate([
            'item_type'    => ['required', Rule::in(['test', 'exam'])],
            'item_id'      => ['required', 'integer'],
            'qIndex'       => ['required', 'integer', 'min:0', 'max:999'],
            'left'         => ['required', 'integer', 'min:0', 'max:86400'],
            'done'         => ['required', 'boolean'],
            'scorePct'     => ['nullable', 'integer', 'min:0', 'max:100'],
            'answers'      => ['array'],
            'answers.*'    => ['array'],
            'answers.*.*'  => ['integer', 'min:0', 'max:99'],
        ]);

        $model = $data['item_type'] === 'test' ? Test::class : Exam::class;
        $item  = $model::findOrFail($data['item_id']);

        abort_unless($item->license_category_id === $student->license_category_id, 403);

        // Keep only well-formed answer indexes — the payload comes from the client.
        $answers = [];
        foreach ($data['answers'] ?? [] as $index => $picks) {
            if (! is_numeric($index)) {
                continue;
            }
            $answers[(int) $index] = array_values(array_unique(array_map('intval', $picks)));
        }

        StudentQuizProgress::updateOrCreate(
            [
                'student_id' => $student->id,
                'item_type'  => $data['item_type'],
                'item_id'    => $data['item_id'],
            ],
            [
                'question_index'    => $data['qIndex'],
                'answers'           => $answers,
                'remaining_seconds' => $data['left'],
                'done'              => $data['done'],
                'score_pct'         => $data['done'] ? ($data['scorePct'] ?? null) : null,
            ]
        );

        return response()->json(['ok' => true]);
    }
}
