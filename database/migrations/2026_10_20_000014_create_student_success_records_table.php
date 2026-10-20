<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_success_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->restrictOnDelete()->cascadeOnUpdate();
            $table->foreignId('license_category_id')->constrained()->restrictOnDelete()->cascadeOnUpdate();
            $table->string('success_type', 30);
            $table->dateTime('achieved_at');
            $table->foreignId('recorded_by')->constrained('users')->restrictOnDelete()->cascadeOnUpdate();
            $table->text('notes')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['student_id', 'achieved_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_success_records');
    }
};
