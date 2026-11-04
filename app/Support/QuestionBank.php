<?php

namespace App\Support;

use App\Models\Question;

class QuestionBank
{
    /**
     * The admin preview and the trainee exam screen read the same payload, so a preview
     * never shows a question differently from the one the trainee actually sits.
     */
    public static function forCategory(?int $categoryId): array
    {
        return Question::where('is_active', true)
            ->where(fn ($q) => $q
                ->where('license_category_id', $categoryId)
                ->orWhereNull('license_category_id')
            )
            ->with(['translations', 'options.translations', 'licenseCategory'])
            ->get()
            ->map(fn (Question $q) => [
                'id'           => $q->id,
                'format'       => $q->question_format ?? 'text_based',
                'textFr'       => $q->textFor('fr'),
                'textAr'       => $q->textFor('ar'),
                'categoryId'   => $q->license_category_id,
                'categoryCode' => $q->licenseCategory?->code,
                'timeSeconds'  => $q->time_limit_seconds,
                'multiple'     => $q->question_type === 'multiple_choice',
                'choices'      => $q->options->sortBy('sort_order')->map(fn ($o) => [
                    'key'      => $o->option_key,
                    'fr'       => $o->textFor('fr'),
                    'ar'       => $o->textFor('ar'),
                    'prefixFr' => $o->prefixFor('fr'),
                    'prefixAr' => $o->prefixFor('ar'),
                    'correct'  => $o->is_correct,
                ])->values()->all(),
                'media'        => [
                    'imageAr'  => $q->image_ar ? route('questions.media', [$q, 'image_ar']).'?v='.$q->updated_at->timestamp : null,
                    'imageFr'  => $q->image_fr ? route('questions.media', [$q, 'image_fr']).'?v='.$q->updated_at->timestamp : null,
                    'audioAr'  => $q->audio_ar ? route('questions.media', [$q, 'audio_ar']).'?v='.$q->updated_at->timestamp : null,
                    'audioFr'  => $q->audio_fr ? route('questions.media', [$q, 'audio_fr']).'?v='.$q->updated_at->timestamp : null,
                ],
            ])
            ->all();
    }
}
