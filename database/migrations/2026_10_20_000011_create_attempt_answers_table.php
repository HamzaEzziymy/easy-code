<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attempt_answers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('attempt_id')->constrained('exam_attempts')->restrictOnDelete()->cascadeOnUpdate();
            $table->foreignId('question_id')->constrained()->restrictOnDelete()->cascadeOnUpdate();
            $table->text('question_text_snapshot');
            $table->enum('question_type_snapshot', ['single_choice', 'multiple_choice']);
            $table->boolean('is_correct')->nullable();
            $table->decimal('earned_points', 6, 2)->nullable();
            $table->timestamp('answered_at')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->unique(['attempt_id', 'question_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attempt_answers');
    }
};
