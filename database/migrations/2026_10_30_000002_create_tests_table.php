<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('license_category_id')->constrained()->restrictOnDelete()->cascadeOnUpdate();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete()->cascadeOnUpdate();
            $table->string('name_ar', 200);
            $table->string('name_fr', 200);
            $table->text('description_ar')->nullable();
            $table->text('description_fr')->nullable();
            $table->string('cover_path')->nullable();
            $table->unsignedSmallInteger('duration_minutes')->default(30);
            $table->decimal('pass_percentage', 5, 2)->default(70);
            $table->enum('status', ['draft', 'published', 'archived'])->default('draft');
            $table->timestamps();

            $table->index(['license_category_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tests');
    }
};
