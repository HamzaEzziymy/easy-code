<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->string('photo_path', 255)->nullable()->after('student_number');
            $table->string('cin', 20)->nullable()->after('photo_path');
            $table->date('birth_date')->nullable()->after('cin');
            $table->string('birthplace', 120)->nullable()->after('birth_date');
            $table->string('gender', 10)->nullable()->after('birthplace');

            $table->index('cin');
        });
    }

    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropIndex(['cin']);
            $table->dropColumn([
                'photo_path',
                'cin',
                'birth_date',
                'birthplace',
                'gender',
            ]);
        });
    }
};
