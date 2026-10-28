<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * text_based  — the original type: bilingual text + labelled answer options.
     * image_based — the new type: one image that shows the full question (situation + wording +
     *               choices), optional audio, and numbered correct-answer toggles (1–4).
     */
    public function up(): void
    {
        Schema::table('questions', function (Blueprint $table) {
            $table->enum('question_format', ['text_based', 'image_based'])
                ->default('text_based')
                ->after('question_type');
        });
    }

    public function down(): void
    {
        Schema::table('questions', function (Blueprint $table) {
            $table->dropColumn('question_format');
        });
    }
};
