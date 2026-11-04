<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentQuizProgress extends Model
{
    public const CREATED_AT = null;

    protected $table = 'student_quiz_progress';

    protected $fillable = [
        'student_id',
        'item_type',
        'item_id',
        'question_index',
        'answers',
        'remaining_seconds',
        'done',
        'score_pct',
    ];

    protected function casts(): array
    {
        return [
            'question_index'    => 'integer',
            'answers'           => 'array',
            'remaining_seconds' => 'integer',
            'done'              => 'boolean',
            'score_pct'         => 'integer',
        ];
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }
}
