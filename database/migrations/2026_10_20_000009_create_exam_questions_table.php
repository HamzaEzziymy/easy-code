<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exam_questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_id')->constrained()->cascadeOnDelete()->cascadeOnUpdate();
            $table->foreignId('question_id')->constrained()->restrictOnDelete()->cascadeOnUpdate();
            $table->unsignedSmallInteger('question_order');
            $table->decimal('points', 6, 2)->default(1);

            $table->unique(['exam_id', 'question_id']);
            $table->unique(['exam_id', 'question_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exam_questions');
    }
};
