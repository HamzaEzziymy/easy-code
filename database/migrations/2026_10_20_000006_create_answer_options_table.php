<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('answer_options', function (Blueprint $table) {
            $table->id();
            $table->foreignId('question_id')->constrained()->cascadeOnDelete()->cascadeOnUpdate();
            $table->string('option_key', 10);
            $table->boolean('is_correct')->default(false);
            $table->unsignedSmallInteger('sort_order')->default(1);
            $table->timestamp('created_at')->useCurrent();

            $table->unique(['question_id', 'option_key']);
            $table->unique(['question_id', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('answer_options');
    }
};
