<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // The category is the one field of a bank entry that may stay empty — a question is often
        // written before anyone decides which licence it belongs to.
        Schema::table('questions', function (Blueprint $table) {
            $table->foreignId('license_category_id')->nullable()->change();
        });

        Schema::table('questions', function (Blueprint $table) {
            $table->unsignedSmallInteger('time_limit_seconds')->nullable()->after('question_type');
            $table->string('image_ar', 1000)->nullable()->after('time_limit_seconds');
            $table->string('image_fr', 1000)->nullable()->after('image_ar');
            $table->string('audio_ar', 1000)->nullable()->after('image_fr');
            $table->string('audio_fr', 1000)->nullable()->after('audio_ar');
        });

        // One media slot per question could not carry an Arabic and a French picture, let alone a
        // recording, so the pair of columns is retired in favour of the four per-language ones.
        Schema::table('questions', function (Blueprint $table) {
            $table->dropColumn(['media_type', 'media_url']);
        });
    }

    public function down(): void
    {
        Schema::table('questions', function (Blueprint $table) {
            $table->enum('media_type', ['none', 'image', 'video'])->default('none')->after('question_type');
            $table->string('media_url', 1000)->nullable()->after('media_type');
            $table->dropColumn(['time_limit_seconds', 'image_ar', 'image_fr', 'audio_ar', 'audio_fr']);
        });

        Schema::table('questions', function (Blueprint $table) {
            $table->foreignId('license_category_id')->nullable(false)->change();
        });
    }
};
