<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_pdf_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete()->cascadeOnUpdate();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete()->cascadeOnUpdate();
            $table->string('pdf_slot', 5); // 'fr' or 'ar'
            $table->unsignedSmallInteger('current_page')->default(1);
            $table->unsignedSmallInteger('total_pages')->default(0);
            $table->unsignedTinyInteger('scroll_pct')->default(0); // 0–100
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();

            $table->unique(['student_id', 'course_id', 'pdf_slot']);
            $table->index(['student_id', 'course_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_pdf_progress');
    }
};
