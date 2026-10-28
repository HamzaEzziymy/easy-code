<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Question extends Model
{
    protected $fillable = [
        'license_category_id',
        'created_by',
        'question_type',
        'question_format',
        'time_limit_seconds',
        'image_ar',
        'image_fr',
        'audio_ar',
        'audio_fr',
        'explanation_ar',
        'explanation_fr',
        'difficulty',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'difficulty' => 'integer',
            'time_limit_seconds' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function licenseCategory(): BelongsTo
    {
        return $this->belongsTo(LicenseCategory::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function translations(): HasMany
    {
        return $this->hasMany(QuestionTranslation::class);
    }

    public function options(): HasMany
    {
        return $this->hasMany(AnswerOption::class);
    }

    public function examQuestions(): HasMany
    {
        return $this->hasMany(ExamQuestion::class);
    }

    public function exams(): BelongsToMany
    {
        return $this->belongsToMany(Exam::class, 'exam_questions')
            ->withPivot(['question_order', 'points']);
    }

    /**
     * The bank holds one translation row per language, so a question with no Arabic text simply
     * has no Arabic row rather than an empty one.
     */
    public function textFor(string $locale): ?string
    {
        return $this->translations->firstWhere('locale', $locale)?->question_text;
    }
}
