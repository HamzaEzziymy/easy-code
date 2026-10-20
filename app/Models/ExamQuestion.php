<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExamQuestion extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'exam_id',
        'question_id',
        'question_order',
        'points',
    ];

    protected function casts(): array
    {
        return [
            'question_order' => 'integer',
            'points' => 'decimal:2',
        ];
    }

    public function exam(): BelongsTo
    {
        return $this->belongsTo(Exam::class);
    }

    public function question(): BelongsTo
    {
        return $this->belongsTo(Question::class);
    }
}
