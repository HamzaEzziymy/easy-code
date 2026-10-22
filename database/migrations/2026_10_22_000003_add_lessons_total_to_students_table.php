<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->unsignedTinyInteger('lessons_total')->nullable()->after('lessons_count');
        });

        // Existing files keep the 30-square bar they were managed with until staff change it.
        DB::table('students')->update(['lessons_total' => 30]);
    }

    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropColumn('lessons_total');
        });
    }
};
