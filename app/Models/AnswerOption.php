<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AnswerOption extends Model
{
    public const UPDATED_AT = null;

    protected $fillable = [
        'question_id',
        'option_key',
        'is_correct',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'is_correct' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    public function question(): BelongsTo
    {
        return $this->belongsTo(Question::class);
    }

    public function translations(): HasMany
    {
        return $this->hasMany(OptionTranslation::class);
    }

    public function textFor(string $locale): ?string
    {
        return $this->translations->firstWhere('locale', $locale)?->option_text;
    }
}
