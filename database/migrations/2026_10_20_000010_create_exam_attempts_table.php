<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exam_attempts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->restrictOnDelete()->cascadeOnUpdate();
            $table->foreignId('exam_id')->constrained()->restrictOnDelete()->cascadeOnUpdate();
            $table->unsignedSmallInteger('attempt_number');
            $table->timestamp('started_at')->useCurrent();
            $table->timestamp('submitted_at')->nullable();
            $table->enum('status', ['in_progress', 'submitted', 'expired'])->default('in_progress');
            $table->decimal('score', 7, 2)->nullable();
            $table->decimal('max_score', 7, 2)->nullable();
            $table->decimal('percentage', 5, 2)->nullable();
            $table->decimal('pass_percentage_snapshot', 5, 2)->nullable();
            $table->boolean('is_passed')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->unique(['student_id', 'exam_id', 'attempt_number']);
            $table->index(['student_id', 'started_at']);
            $table->index(['exam_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exam_attempts');
    }
};
