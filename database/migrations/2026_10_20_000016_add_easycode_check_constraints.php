<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * SQLite has no ALTER TABLE ... ADD CONSTRAINT ... CHECK support, so these
     * database-level guarantees are only applied on MySQL.
     */
    public function up(): void
    {
        if (DB::connection()->getDriverName() !== 'mysql') {
            return;
        }

        foreach ($this->constraints() as $statement) {
            DB::statement($statement);
        }
    }

    public function down(): void
    {
        if (DB::connection()->getDriverName() !== 'mysql') {
            return;
        }

        foreach ($this->dropStatements() as $statement) {
            DB::statement($statement);
        }
    }

    private function constraints(): array
    {
        return [
            "ALTER TABLE users ADD CONSTRAINT chk_users_login_method
                CHECK (role <> 'admin' OR login_code_hash IS NULL)",

            'ALTER TABLE questions ADD CONSTRAINT chk_questions_difficulty
                CHECK (difficulty BETWEEN 1 AND 5)',

            'ALTER TABLE exams ADD CONSTRAINT chk_exams_duration
                CHECK (duration_minutes > 0)',

            'ALTER TABLE exams ADD CONSTRAINT chk_exams_pass_percentage
                CHECK (pass_percentage BETWEEN 0 AND 100)',

            'ALTER TABLE exam_questions ADD CONSTRAINT chk_exam_question_points
                CHECK (points > 0)',

            'ALTER TABLE exam_attempts ADD CONSTRAINT chk_attempt_number
                CHECK (attempt_number > 0)',

            'ALTER TABLE exam_attempts ADD CONSTRAINT chk_attempt_score
                CHECK (score IS NULL OR (score >= 0 AND max_score IS NOT NULL AND score <= max_score))',

            'ALTER TABLE exam_attempts ADD CONSTRAINT chk_attempt_percentage
                CHECK (percentage IS NULL OR percentage BETWEEN 0 AND 100)',

            'ALTER TABLE exam_attempts ADD CONSTRAINT chk_attempt_pass_percentage
                CHECK (pass_percentage_snapshot IS NULL OR pass_percentage_snapshot BETWEEN 0 AND 100)',

            "ALTER TABLE exam_attempts ADD CONSTRAINT chk_attempt_final_result
                CHECK (status = 'in_progress' OR (
                    submitted_at IS NOT NULL
                    AND score IS NOT NULL
                    AND max_score IS NOT NULL
                    AND max_score > 0
                    AND percentage IS NOT NULL
                    AND pass_percentage_snapshot IS NOT NULL
                    AND is_passed IS NOT NULL
                ))",

            'ALTER TABLE attempt_answers ADD CONSTRAINT chk_attempt_answer_points
                CHECK (earned_points IS NULL OR earned_points >= 0)',
        ];
    }

    private function dropStatements(): array
    {
        return [
            'ALTER TABLE attempt_answers DROP CHECK chk_attempt_answer_points',
            'ALTER TABLE exam_attempts DROP CHECK chk_attempt_final_result',
            'ALTER TABLE exam_attempts DROP CHECK chk_attempt_pass_percentage',
            'ALTER TABLE exam_attempts DROP CHECK chk_attempt_percentage',
            'ALTER TABLE exam_attempts DROP CHECK chk_attempt_score',
            'ALTER TABLE exam_attempts DROP CHECK chk_attempt_number',
            'ALTER TABLE exam_questions DROP CHECK chk_exam_question_points',
            'ALTER TABLE exams DROP CHECK chk_exams_pass_percentage',
            'ALTER TABLE exams DROP CHECK chk_exams_duration',
            'ALTER TABLE questions DROP CHECK chk_questions_difficulty',
            'ALTER TABLE users DROP CHECK chk_users_login_method',
        ];
    }
};
