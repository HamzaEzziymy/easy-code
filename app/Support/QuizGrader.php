<?php

namespace App\Support;

use App\Models\Exam;
use App\Models\Test;

class QuizGrader
{
    /**
     * Scores a sitting from the stored answers, so the grade never depends on
     * what the browser claims. Mirrors the question order the trainee sees.
     *
     * @return array{correct:int,total:int,pct:int}|null
     */
    public static function grade(string $type, int $itemId, ?int $categoryId, array $answers): ?array
    {
        $item = $type === 'test' ? Test::find($itemId) : Exam::find($itemId);

        if ($item === null) {
            return null;
        }

        $questionIds = $type === 'test'
            ? $item->testQuestions()->orderBy('question_order')->pluck('question_id')->all()
            : $item->examQuestions()->orderBy('question_order')->pluck('question_id')->all();

        $bank = collect(QuestionBank::forCategory($categoryId))->keyBy('id');

        $correct = 0;
        $total   = 0;

        foreach ($questionIds as $index => $questionId) {
            $question = $bank->get($questionId);

            if ($question === null) {
                continue;
            }

            $total++;

            $wanted = [];
            foreach ($question['choices'] as $i => $choice) {
                if ($choice['correct']) {
                    $wanted[] = $i;
                }
            }

            $picked = array_map('intval', $answers[$index] ?? []);
            sort($picked);

            if ($picked !== [] && count($picked) === count($wanted) && array_diff($wanted, $picked) === []) {
                $correct++;
            }
        }

        return [
            'correct' => $correct,
            'total'   => $total,
            'pct'     => $total > 0 ? (int) round($correct / $total * 100) : 0,
        ];
    }
}
