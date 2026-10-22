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
            $table->string('first_name', 120)->nullable()->after('student_number');
            $table->string('last_name', 120)->nullable()->after('first_name');
            $table->string('first_name_ar', 120)->nullable()->after('last_name');
            $table->string('last_name_ar', 120)->nullable()->after('first_name_ar');
            $table->unsignedSmallInteger('lessons_count')->nullable()->after('phone');
        });

        $this->backfill();
    }

    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropColumn([
                'first_name',
                'last_name',
                'first_name_ar',
                'last_name_ar',
                'lessons_count',
            ]);
        });
    }

    /**
     * Files created before the split only carry one free-text name, so the first
     * word becomes the given name and the rest the family name.
     */
    private function backfill(): void
    {
        DB::table('students')
            ->whereNull('first_name')
            ->join('users', 'users.id', '=', 'students.user_id')
            ->select('students.id', 'users.name')
            ->get()
            ->each(function ($row) {
                $words = preg_split('/\s+/u', trim((string) $row->name), 2);

                if ($words === [] || $words[0] === '') {
                    return;
                }

                DB::table('students')
                    ->where('id', $row->id)
                    ->update([
                        'first_name' => $words[0],
                        'last_name' => $words[1] ?? null,
                    ]);
            });
    }
};
