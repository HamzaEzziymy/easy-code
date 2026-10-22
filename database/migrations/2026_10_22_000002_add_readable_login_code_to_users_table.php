<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * login_code_hash proves the code but cannot be read back, so staff had no way to
     * tell a trainee their code. The mirror column is only ever written from the plain
     * code the staff member just typed, and stays behind the admin guard.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('login_code', 32)->nullable()->after('login_code_hash');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('login_code');
        });
    }
};
