<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('student_quiz_progress', function (Blueprint $table) {
            $table->unsignedSmallInteger('correct_count')->nullable()->after('score_pct');
            $table->unsignedSmallInteger('questions_total')->nullable()->after('correct_count');
        });
    }

    public function down(): void
    {
        Schema::table('student_quiz_progress', function (Blueprint $table) {
            $table->dropColumn(['correct_count', 'questions_total']);
        });
    }
};
