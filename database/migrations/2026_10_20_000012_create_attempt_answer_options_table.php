<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attempt_answer_options', function (Blueprint $table) {
            $table->id();
            $table->foreignId('attempt_answer_id')->constrained()->restrictOnDelete()->cascadeOnUpdate();
            $table->foreignId('answer_option_id')->constrained()->restrictOnDelete()->cascadeOnUpdate();
            $table->text('option_text_snapshot');
            $table->boolean('is_correct_at_attempt');

            $table->unique(['attempt_answer_id', 'answer_option_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attempt_answer_options');
    }
};
