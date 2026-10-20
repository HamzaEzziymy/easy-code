<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AttemptAnswer extends Model
{
    public const UPDATED_AT = null;

    protected $fillable = [
        'attempt_id',
        'question_id',
        'question_text_snapshot',
        'question_type_snapshot',
        'is_correct',
        'earned_points',
        'answered_at',
    ];

    protected function casts(): array
    {
        return [
            'is_correct' => 'boolean',
            'earned_points' => 'decimal:2',
            'answered_at' => 'datetime',
        ];
    }

    public function attempt(): BelongsTo
    {
        return $this->belongsTo(ExamAttempt::class, 'attempt_id');
    }

    public function question(): BelongsTo
    {
        return $this->belongsTo(Question::class);
    }

    public function selectedOptions(): HasMany
    {
        return $this->hasMany(AttemptAnswerOption::class);
    }
}
