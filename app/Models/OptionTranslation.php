<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OptionTranslation extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'answer_option_id',
        'locale',
        'option_text',
        'prefix',
    ];

    public function answerOption(): BelongsTo
    {
        return $this->belongsTo(AnswerOption::class);
    }
}
