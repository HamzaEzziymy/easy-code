<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('question_translations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('question_id')->constrained()->cascadeOnDelete()->cascadeOnUpdate();
            $table->enum('locale', ['ar', 'fr']);
            $table->text('question_text');
            $table->timestamps();

            $table->unique(['question_id', 'locale']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('question_translations');
    }
};
