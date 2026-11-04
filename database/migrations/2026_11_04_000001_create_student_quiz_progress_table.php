<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_quiz_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete()->cascadeOnUpdate();
            $table->string('item_type', 10); // 'test' or 'exam'
            $table->unsignedBigInteger('item_id');
            $table->unsignedSmallInteger('question_index')->default(0);
            $table->json('answers')->nullable();
            $table->unsignedSmallInteger('remaining_seconds')->default(0);
            $table->boolean('done')->default(false);
            $table->unsignedTinyInteger('score_pct')->nullable();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();

            $table->unique(['student_id', 'item_type', 'item_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_quiz_progress');
    }
};
