<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('exams', function (Blueprint $table) {
            if (! Schema::hasColumn('exams', 'description_ar')) {
                $table->text('description_ar')->nullable()->after('description');
            }
            if (! Schema::hasColumn('exams', 'cover_path')) {
                $table->string('cover_path')->nullable()->after('status');
            }
        });
    }

    public function down(): void
    {
        Schema::table('exams', function (Blueprint $table) {
            $table->dropColumn(['description_ar', 'cover_path']);
        });
    }
};
