<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentPdfProgress extends Model
{
    public const CREATED_AT = null;

    protected $table = 'student_pdf_progress';

    protected $fillable = [
        'student_id',
        'course_id',
        'pdf_slot',
        'current_page',
        'total_pages',
        'scroll_pct',
    ];

    protected function casts(): array
    {
        return [
            'current_page' => 'integer',
            'total_pages'  => 'integer',
            'scroll_pct'   => 'integer',
        ];
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }
}
