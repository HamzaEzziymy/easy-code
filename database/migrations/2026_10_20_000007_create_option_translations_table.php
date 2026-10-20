<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('option_translations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('answer_option_id')->constrained()->cascadeOnDelete()->cascadeOnUpdate();
            $table->enum('locale', ['ar', 'fr']);
            $table->text('option_text');

            $table->unique(['answer_option_id', 'locale']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('option_translations');
    }
};
