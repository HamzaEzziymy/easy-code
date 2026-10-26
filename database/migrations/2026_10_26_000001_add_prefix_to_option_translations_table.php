<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('option_translations', function (Blueprint $table) {
            $table->string('prefix', 60)->nullable()->after('option_text');
        });
    }

    public function down(): void
    {
        Schema::table('option_translations', function (Blueprint $table) {
            $table->dropColumn('prefix');
        });
    }
};
