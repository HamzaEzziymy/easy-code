<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', ['admin', 'student'])->default('student')->after('name');
            $table->string('login_code_hash')->nullable()->unique()->after('password');
            $table->boolean('is_active')->default(true)->after('login_code_hash');
            $table->unsignedSmallInteger('failed_login_attempts')->default(0)->after('is_active');
            $table->timestamp('last_login_at')->nullable()->after('failed_login_attempts');
        });

        // Students authenticate with a login code only: no email, no password.
        Schema::table('users', function (Blueprint $table) {
            $table->string('email')->nullable()->change();
            $table->string('password')->nullable()->change();
        });

        // Every account that predates the student role belongs to an operator.
        DB::table('users')->whereNull('login_code_hash')->update(['role' => 'admin']);
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['login_code_hash']);
            $table->dropColumn([
                'role',
                'login_code_hash',
                'is_active',
                'failed_login_attempts',
                'last_login_at',
            ]);
        });
    }
};
