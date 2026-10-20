<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AttemptAnswerOption extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'attempt_answer_id',
        'answer_option_id',
        'option_text_snapshot',
        'is_correct_at_attempt',
    ];

    protected function casts(): array
    {
        return [
            'is_correct_at_attempt' => 'boolean',
        ];
    }

    public function attemptAnswer(): BelongsTo
    {
        return $this->belongsTo(AttemptAnswer::class);
    }

    public function answerOption(): BelongsTo
    {
        return $this->belongsTo(AnswerOption::class);
    }
}
