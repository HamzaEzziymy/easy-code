<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('license_category_id')->constrained()->restrictOnDelete()->cascadeOnUpdate();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete()->cascadeOnUpdate();
            $table->enum('question_type', ['single_choice', 'multiple_choice'])->default('single_choice');
            $table->enum('media_type', ['none', 'image', 'video'])->default('none');
            $table->string('media_url', 1000)->nullable();
            $table->text('explanation_ar')->nullable();
            $table->text('explanation_fr')->nullable();
            $table->unsignedTinyInteger('difficulty')->default(1);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['license_category_id', 'is_active']);
            $table->index('question_type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('questions');
    }
};
