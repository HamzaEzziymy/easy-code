<?php

namespace Tests\Feature\Admin;

use App\Models\AnswerOption;
use App\Models\AttemptAnswer;
use App\Models\AttemptAnswerOption;
use App\Models\Exam;
use App\Models\ExamAttempt;
use App\Models\LicenseCategory;
use App\Models\Question;
use App\Models\Student;
use App\Models\StudentAppointment;
use App\Models\StudentSuccessRecord;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class StudentsManagementTest extends TestCase
{
    use RefreshDatabase;

    private function admin(array $attributes = []): User
    {
        return User::factory()->create($attributes + [
            'role' => 'admin',
            'email' => 'admin'.uniqid().'@example.com',
            'password' => 'password',
        ]);
    }

    private function category(): LicenseCategory
    {
        return LicenseCategory::firstOrCreate(['code' => 'B'], [
            'name_fr' => 'Voiture légère',
            'name_ar' => 'سيارة خفيفة',
            'is_active' => true,
        ]);
    }

    private function payload(array $overrides = []): array
    {
        return $overrides + [
            'first_name' => 'Youssef',
            'last_name' => 'Test',
            'first_name_ar' => 'يوسف',
            'last_name_ar' => 'تيست',
            'login_code' => 'EC-2026-7001',
            'student_number' => 'EC-2026-7001',
            'license_category_id' => $this->category()->id,
            'enrollment_date' => '2026-01-12',
            'status' => 'active',
            'phone' => '0611111111',
            'cin' => 'AB123456',
            'birth_date' => '2001-04-02',
            'birthplace' => 'Casa',
            'gender' => 'male',
            'notes' => 'Evening classes',
        ];
    }

    private function makeStudent(array $overrides = []): Student
    {
        $this->actingAs($this->admin())->post('/students', $this->payload($overrides));

        return Student::where('student_number', $overrides['student_number'] ?? 'EC-2026-7001')->firstOrFail();
    }

    public function test_students_cannot_open_the_students_screen(): void
    {
        $student = User::factory()->create(['role' => 'student']);

        $this->actingAs($student)->get('/students')->assertRedirect(route('student.dashboard'));
    }

    public function test_guests_are_sent_to_the_login_page(): void
    {
        $this->get('/students')->assertRedirect(route('login'));
    }

    public function test_the_list_shows_files_with_stats(): void
    {
        $actor = $this->admin();
        $this->makeStudent();
        $this->makeStudent(['student_number' => 'EC-2026-7002', 'login_code' => 'EC-2026-7002', 'status' => 'completed']);

        $this->actingAs($actor)
            ->get('/students')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Students/Index')
                ->where('stats.total', 2)
                ->where('stats.active', 1)
                ->where('stats.completed', 1)
                ->has('students.data', 2)
                ->has('students.data.0.category')
                ->where('filters.sort', 'enrollment_date')
            );
    }

    public function test_creating_a_file_also_creates_a_sign_in_account(): void
    {
        Storage::fake('local');
        $actor = $this->admin();

        $this->actingAs($actor)
            ->post('/students', $this->payload(['photo' => UploadedFile::fake()->image('pupil.jpg')]))
            ->assertRedirect();

        $student = Student::firstOrFail();
        $account = $student->user;

        $this->assertTrue($account->isStudent());
        $this->assertTrue($account->matchesLoginCode('ec-2026-7001'));
        $this->assertSame('AB123456', $student->cin);
        $this->assertSame('2001-04-02', $student->birth_date->toDateString());
        $this->assertNotNull($student->photo_path);
        Storage::disk('local')->assertExists($student->photo_path);
    }

    public function test_the_login_code_is_required_when_creating(): void
    {
        $actor = $this->admin();

        $this->actingAs($actor)->post('/students', $this->payload(['login_code' => '']))
            ->assertSessionHasErrors('login_code');

        $this->assertSame(0, Student::count());
    }

    public function test_a_taken_login_code_is_rejected_without_writing_anything(): void
    {
        $actor = $this->admin();
        User::factory()->create(['role' => 'student', 'login_code_hash' => User::hashLoginCode('EC-2026-7001')]);

        $this->actingAs($actor)->post('/students', $this->payload())
            ->assertSessionHasErrors('login_code');

        $this->assertSame(0, Student::count());
    }

    public function test_a_duplicate_file_number_is_rejected(): void
    {
        $actor = $this->admin();
        $this->makeStudent();

        $this->actingAs($actor)->post('/students', $this->payload(['login_code' => 'EC-2026-7777']))
            ->assertSessionHasErrors('student_number');

        $this->assertSame(1, Student::count());
    }

    public function test_the_entry_date_is_required(): void
    {
        $actor = $this->admin();

        $this->actingAs($actor)->post('/students', $this->payload(['enrollment_date' => '']))
            ->assertSessionHasErrors('enrollment_date');
    }

    public function test_editing_keeps_the_code_when_the_field_is_blank(): void
    {
        $actor = $this->admin();
        $student = $this->makeStudent();

        $this->actingAs($actor)->patch("/students/{$student->id}", $this->payload([
            'first_name' => 'Renamed',
            'last_name' => 'Pupil',
            'birthplace' => 'Rabat',
            'login_code' => '',
            'student_number' => 'EC-2026-7001',
        ]))->assertRedirect(route('students.show', $student));

        $student->refresh();
        $this->assertSame('Renamed Pupil', $student->user->name);
        $this->assertSame('Renamed', $student->first_name);
        $this->assertSame('Rabat', $student->birthplace);
        $this->assertTrue($student->user->matchesLoginCode('EC-2026-7001'));
    }

    public function test_the_family_and_given_names_are_required(): void
    {
        $actor = $this->admin();

        $this->actingAs($actor)->post('/students', $this->payload(['first_name' => '', 'last_name' => '']))
            ->assertSessionHasErrors(['first_name', 'last_name']);

        $this->assertSame(0, Student::count());
    }

    public function test_the_national_id_is_required(): void
    {
        $actor = $this->admin();

        $this->actingAs($actor)->post('/students', $this->payload(['cin' => '']))
            ->assertSessionHasErrors('cin');

        $this->assertSame(0, Student::count());
    }

    public function test_the_gender_is_required_and_offers_only_two_answers(): void
    {
        $actor = $this->admin();

        $this->actingAs($actor)->post('/students', $this->payload(['gender' => '']))
            ->assertSessionHasErrors('gender');

        $this->actingAs($actor)->post('/students', $this->payload(['gender' => 'unknown']))
            ->assertSessionHasErrors('gender');

        $this->actingAs($actor)->post('/students', $this->payload(['gender' => 'female']))
            ->assertSessionHasNoErrors();

        $this->assertSame('female', Student::firstOrFail()->gender);
    }

    public function test_the_seance_bar_on_the_file_page_records_the_sessions(): void
    {
        $actor = $this->admin();
        $student = $this->makeStudent();

        $this->assertNull($student->lessons_count);

        $this->actingAs($actor)->patch("/students/{$student->id}/lessons", ['lessons_count' => 12])
            ->assertRedirect();

        $this->assertSame(12, $student->refresh()->lessons_count);

        // Clicking the last filled square again takes one back off.
        $this->actingAs($actor)->patch("/students/{$student->id}/lessons", ['lessons_count' => 11]);
        $this->assertSame(11, $student->refresh()->lessons_count);

        $this->actingAs($actor)->patch("/students/{$student->id}/lessons", ['lessons_count' => 0]);
        $this->assertSame(0, $student->refresh()->lessons_count);

        // The rest of the file is untouched by the click.
        $this->assertSame('EC-2026-7001', $student->refresh()->student_number);
    }

    public function test_the_seance_bar_refuses_more_sessions_than_it_has_squares(): void
    {
        $actor = $this->admin();
        $student = $this->makeStudent();

        $this->actingAs($actor)->patch("/students/{$student->id}/lessons", ['lessons_count' => 31])
            ->assertSessionHasErrors('lessons_count');

        $this->assertNull($student->refresh()->lessons_count);
    }

    public function test_a_trainee_cannot_click_the_seance_bar(): void
    {
        $student = $this->makeStudent();

        $this->actingAs($student->user)
            ->patch("/students/{$student->id}/lessons", ['lessons_count' => 30])
            ->assertRedirect(route('student.dashboard'));

        $this->assertNull($student->refresh()->lessons_count);
    }

    public function test_the_maximum_squares_set_how_many_seances_the_bar_has(): void
    {
        $actor = $this->admin();
        $student = $this->makeStudent(['lessons_total' => 40]);

        $this->assertSame(40, $student->lessons_total);

        // A maximum larger than the bar's squares is refused, but squares-sized counts pass.
        $this->actingAs($actor)->patch("/students/{$student->id}/lessons", ['lessons_count' => 41])
            ->assertSessionHasErrors('lessons_count');

        $this->actingAs($actor)->patch("/students/{$student->id}/lessons", ['lessons_count' => 40]);
        $this->assertSame(40, $student->refresh()->lessons_count);

        $this->actingAs($actor)->get("/students/{$student->id}")
            ->assertInertia(fn ($page) => $page->where('student.lessonsTotal', 40));
    }

    public function test_the_form_folds_arabic_digits_in_the_maximum(): void
    {
        $this->actingAs($this->admin())
            ->post('/students', $this->payload(['lessons_total' => '٢٥']))
            ->assertSessionHasNoErrors();

        $this->assertSame(25, Student::firstOrFail()->lessons_total);
    }

    public function test_the_maximum_is_capped_at_the_two_squares(): void
    {
        $this->actingAs($this->admin())
            ->post('/students', $this->payload(['lessons_total' => '100']))
            ->assertSessionHasErrors('lessons_total');
    }

    public function test_lowering_the_maximum_trims_the_recorded_sessions(): void
    {
        $actor = $this->admin();
        $student = $this->makeStudent();

        $this->actingAs($actor)->patch("/students/{$student->id}/lessons", ['lessons_count' => 20]);
        $this->assertSame(20, $student->refresh()->lessons_count);

        $this->actingAs($actor)->patch("/students/{$student->id}", $this->payload([
            'lessons_total' => 12,
        ]));

        $student->refresh();
        $this->assertSame(12, $student->lessons_total);
        $this->assertSame(12, $student->lessons_count);
    }

    public function test_a_new_photo_replaces_the_previous_one(): void
    {
        Storage::fake('local');
        $actor = $this->admin();
        $student = $this->makeStudent(['photo' => UploadedFile::fake()->image('first.jpg')]);

        $first = $student->photo_path;

        $this->actingAs($actor)->patch("/students/{$student->id}", $this->payload([
            'photo' => UploadedFile::fake()->image('second.jpg'),
        ]));

        $student->refresh();
        $this->assertNotSame($first, $student->photo_path);
        Storage::disk('local')->assertMissing($first);
        Storage::disk('local')->assertExists($student->photo_path);
    }

    public function test_the_form_sends_an_edit_as_a_post_with_a_spoofed_patch(): void
    {
        Storage::fake('local');
        $actor = $this->admin();
        $student = $this->makeStudent(['photo' => UploadedFile::fake()->image('first.jpg')]);

        // A multipart body is only parsed by PHP on POST, so the browser rides on method spoofing.
        $this->actingAs($actor)->post("/students/{$student->id}", $this->payload([
            '_method' => 'patch',
            'photo' => UploadedFile::fake()->image('second.jpg'),
        ]))->assertSessionHas('success', 'updated');

        $this->assertNotNull($student->refresh()->photo_path);
    }

    public function test_the_photo_can_be_removed_from_the_form(): void
    {
        Storage::fake('local');
        $actor = $this->admin();
        $student = $this->makeStudent(['photo' => UploadedFile::fake()->image('pupil.jpg')]);
        $path = $student->photo_path;

        $this->actingAs($actor)->patch("/students/{$student->id}", $this->payload(['remove_photo' => '1']));

        $this->assertNull($student->refresh()->photo_path);
        Storage::disk('local')->assertMissing($path);
    }

    public function test_the_file_page_exposes_history_sections(): void
    {
        $actor = $this->admin();
        $student = $this->makeStudent();

        $this->actingAs($actor)->patch("/students/{$student->id}/lessons", ['lessons_count' => 12]);

        $exam = Exam::create([
            'license_category_id' => $this->category()->id,
            'created_by' => $actor->id,
            'title_fr' => 'Code de la route',
            'title_ar' => 'مدوناة السير',
            'duration_minutes' => 30,
            'pass_percentage' => 70,
            'status' => 'published',
        ]);

        StudentAppointment::create([
            'student_id' => $student->id,
            'exam_id' => $exam->id,
            'appointment_type' => 'exam',
            'scheduled_at' => now()->addDays(3),
            'status' => 'scheduled',
            'created_by' => $actor->id,
        ]);

        ExamAttempt::create([
            'student_id' => $student->id,
            'exam_id' => $exam->id,
            'attempt_number' => 1,
            'started_at' => now()->subDays(2),
            'submitted_at' => now()->subDays(2),
            'status' => 'submitted',
            'score' => 34,
            'max_score' => 40,
            'percentage' => 85,
            'pass_percentage_snapshot' => 70,
            'is_passed' => true,
        ]);

        $this->actingAs($actor)
            ->get("/students/{$student->id}")
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Students/Show')
                ->where('student.name', 'Youssef Test')
                ->where('student.firstNameAr', 'يوسف')
                ->where('student.lessonsCount', 12)
                ->where('student.loginCode', 'EC-2026-7001')
                ->where('student.category.code', 'B')
                ->has('student.appointments', 1)
                ->has('student.successRecords', 0)
                ->where('student.attempts.count', 1)
                ->has('student.attempts.average')
                ->where('student.attempts.passed', 1)
            );
    }

    public function test_the_photo_is_only_served_to_staff_and_the_owner(): void
    {
        Storage::fake('local');
        $actor = $this->admin();
        $student = $this->makeStudent(['photo' => UploadedFile::fake()->image('pupil.jpg')]);

        $this->actingAs($actor)->get("/students/{$student->id}/photo")->assertOk();
        $this->actingAs($student->user)->get("/students/{$student->id}/photo")->assertOk();

        $outsider = User::factory()->create(['role' => 'student']);
        $this->actingAs($outsider)->get("/students/{$student->id}/photo")->assertForbidden();
    }

    public function test_a_missing_photo_returns_a_404(): void
    {
        Storage::fake('local');
        $actor = $this->admin();
        $student = $this->makeStudent();

        $this->actingAs($actor)->get("/students/{$student->id}/photo")->assertNotFound();
    }

    public function test_blocking_sign_in_and_unblocking_it(): void
    {
        $actor = $this->admin();
        $student = $this->makeStudent();

        $this->actingAs($actor)->patch("/students/{$student->id}/active");
        $this->assertFalse($student->user->refresh()->is_active);

        $this->actingAs($actor)->patch("/students/{$student->id}/active");
        $this->assertTrue($student->user->refresh()->is_active);
    }

    public function test_deleting_a_file_removes_the_account_and_the_photo(): void
    {
        Storage::fake('local');
        $actor = $this->admin();
        $student = $this->makeStudent(['photo' => UploadedFile::fake()->image('pupil.jpg')]);
        $userId = $student->user_id;
        $path = $student->photo_path;

        $this->actingAs($actor)->delete("/students/{$student->id}")
            ->assertRedirect(route('students.index'));

        $this->assertSame(0, Student::count());
        $this->assertFalse(User::find($userId)?->exists() ?? false);
        Storage::disk('local')->assertMissing($path);
    }

    public function test_deleting_a_file_also_removes_its_history(): void
    {
        $actor = $this->admin();
        $student = $this->makeStudent();

        $exam = Exam::create([
            'license_category_id' => $this->category()->id,
            'created_by' => $actor->id,
            'title_fr' => 'Code',
            'title_ar' => 'المدوناة',
            'duration_minutes' => 30,
            'pass_percentage' => 70,
            'status' => 'published',
        ]);

        $question = Question::create([
            'license_category_id' => $this->category()->id,
            'created_by' => $actor->id,
            'question_type' => 'single_choice',
        ]);

        $option = AnswerOption::create([
            'question_id' => $question->id,
            'option_key' => 'A',
            'is_correct' => true,
            'sort_order' => 1,
        ]);

        $attempt = ExamAttempt::create([
            'student_id' => $student->id,
            'exam_id' => $exam->id,
            'attempt_number' => 1,
            'started_at' => now()->subDays(2),
            'status' => 'submitted',
            'score' => 34,
            'max_score' => 40,
            'percentage' => 85,
            'pass_percentage_snapshot' => 70,
            'is_passed' => true,
        ]);

        $answer = AttemptAnswer::create([
            'attempt_id' => $attempt->id,
            'question_id' => $question->id,
            'question_text_snapshot' => 'Combien de voies ?',
            'question_type_snapshot' => 'single_choice',
            'is_correct' => true,
        ]);

        AttemptAnswerOption::create([
            'attempt_answer_id' => $answer->id,
            'answer_option_id' => $option->id,
            'option_text_snapshot' => 'Deux',
            'is_correct_at_attempt' => true,
        ]);

        StudentAppointment::create([
            'student_id' => $student->id,
            'exam_id' => $exam->id,
            'appointment_type' => 'exam',
            'scheduled_at' => now(),
            'status' => 'scheduled',
            'created_by' => $actor->id,
        ]);

        StudentSuccessRecord::create([
            'student_id' => $student->id,
            'license_category_id' => $this->category()->id,
            'success_type' => 'code',
            'achieved_at' => now(),
            'recorded_by' => $actor->id,
        ]);

        $this->actingAs($actor)->delete("/students/{$student->id}")
            ->assertRedirect(route('students.index'))->assertSessionHas('success', 'deleted');

        $this->assertSame(0, Student::count());
        $this->assertFalse(User::find($student->user_id)?->exists() ?? false);
        $this->assertSame(0, ExamAttempt::count());
        $this->assertSame(0, AttemptAnswer::count());
        $this->assertSame(0, AttemptAnswerOption::count());
        $this->assertSame(0, StudentAppointment::count());
        $this->assertSame(0, StudentSuccessRecord::count());

        // The shared catalogue stays where it is.
        $this->assertSame(1, Exam::count());
        $this->assertSame(1, Question::count());
        $this->assertSame(1, AnswerOption::count());
    }

    public function test_the_list_reports_the_history_a_deletion_would_remove(): void
    {
        $actor = $this->admin();
        $student = $this->makeStudent();

        ExamAttempt::create([
            'student_id' => $student->id,
            'exam_id' => Exam::create([
                'license_category_id' => $this->category()->id,
                'created_by' => $actor->id,
                'title_fr' => 'Code',
                'title_ar' => 'المدوناة',
                'duration_minutes' => 30,
                'pass_percentage' => 70,
                'status' => 'published',
            ])->id,
            'attempt_number' => 1,
            'started_at' => now(),
            'status' => 'submitted',
        ]);

        $this->actingAs($actor)->get('/students')
            ->assertInertia(fn ($page) => $page
                ->where('students.data.0.history.attempts', 1)
                ->where('students.data.0.history.appointments', 0)
                ->where('students.data.0.history.records', 0)
            );
    }

    public function test_search_and_filters_narrow_the_list(): void
    {
        $actor = $this->admin();
        $this->makeStudent(['student_number' => 'EC-2026-7001', 'login_code' => 'EC-2026-7001', 'cin' => 'AA1']);
        $this->makeStudent(['student_number' => 'EC-2026-7002', 'login_code' => 'EC-2026-7002', 'cin' => 'BB2', 'status' => 'suspended']);

        $this->actingAs($actor)->get('/students?search=BB2')
            ->assertInertia(fn ($page) => $page
                ->has('students.data', 1)
                ->where('students.data.0.studentNumber', 'EC-2026-7002')
            );

        $this->actingAs($actor)->get('/students?status=suspended')
            ->assertInertia(fn ($page) => $page->has('students.data', 1)->where('students.total', 1));

        $this->actingAs($actor)->get("/students?category={$this->category()->id}")
            ->assertInertia(fn ($page) => $page->has('students.data', 2));

        $this->actingAs($actor)->get('/students?sort=student_number&direction=asc')
            ->assertInertia(fn ($page) => $page->where('students.data.0.studentNumber', 'EC-2026-7001'));
    }

    public function test_the_contact_column_carries_the_phone_and_the_email(): void
    {
        $actor = $this->admin();
        $this->makeStudent([
            'student_number' => 'EC-2026-7010',
            'login_code' => 'EC-2026-7010',
            'email' => 'pupil@example.com',
            'phone' => '0622222222',
        ]);

        $this->actingAs($actor)->get('/students?search=EC-2026-7010')
            ->assertInertia(fn ($page) => $page
                ->where('students.data.0.phone', '0622222222')
                ->where('students.data.0.email', 'pupil@example.com')
            );
    }

    public function test_the_language_a_trainee_sits_the_exam_in_is_recorded_on_the_file(): void
    {
        $actor = $this->admin();
        $student = $this->makeStudent([
            'student_number' => 'EC-2026-7011',
            'login_code' => 'EC-2026-7011',
            'exam_language' => 'ar',
        ]);

        $this->assertSame('ar', $student->refresh()->exam_language);

        $this->actingAs($actor)->get('/students?search=EC-2026-7011')
            ->assertInertia(fn ($page) => $page->where('students.data.0.examLanguage', 'ar'));

        $this->actingAs($actor)->get("/students/{$student->id}")
            ->assertInertia(fn ($page) => $page->where('student.examLanguage', 'ar'));
    }

    public function test_the_exam_language_starts_empty_and_can_be_cleared_again(): void
    {
        $actor = $this->admin();
        $student = $this->makeStudent();

        $this->assertNull($student->refresh()->exam_language);

        $this->actingAs($actor)->patch("/students/{$student->id}", $this->payload([
            'exam_language' => 'fr',
        ]));
        $this->assertSame('fr', $student->refresh()->exam_language);

        $this->actingAs($actor)->patch("/students/{$student->id}", $this->payload([
            'exam_language' => '',
        ]));
        $this->assertNull($student->refresh()->exam_language);
    }

    public function test_an_exam_language_the_theory_exam_has_no_text_in_is_refused(): void
    {
        $actor = $this->admin();
        $student = $this->makeStudent(['exam_language' => 'ar']);

        $this->actingAs($actor)->patch("/students/{$student->id}", $this->payload([
            'exam_language' => 'es',
        ]))->assertSessionHasErrors('exam_language');

        $this->assertSame('ar', $student->refresh()->exam_language);
    }

    public function test_a_blocked_account_is_hidden_by_the_access_filter(): void
    {
        $actor = $this->admin();
        $student = $this->makeStudent();
        $this->makeStudent(['student_number' => 'EC-2026-7002', 'login_code' => 'EC-2026-7002']);

        $this->actingAs($actor)->patch("/students/{$student->id}/active");

        $this->actingAs($actor)->get('/students?access=inactive')
            ->assertInertia(fn ($page) => $page->has('students.data', 1)->where('students.data.0.id', $student->id));
    }

    public function test_the_create_form_prefills_a_suggested_file_number(): void
    {
        $actor = $this->admin();
        $this->makeStudent();

        $this->actingAs($actor)->get('/students/create')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Students/Form')
                ->where('student', null)
                ->where('suggestedNumber', 'EC-'.now()->format('Y').'-7002')
                ->has('categories', 1)
            );
    }

    public function test_the_edit_form_hands_the_current_login_code_back(): void
    {
        $actor = $this->admin();
        $student = $this->makeStudent();

        $this->actingAs($actor)->get("/students/{$student->id}/edit")
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Students/Form')
                ->where('student.loginCode', 'EC-2026-7001')
                ->where('student.firstName', 'Youssef')
                ->where('student.lastName', 'Test')
            );
    }

    public function test_assigning_a_new_code_updates_the_readable_copy(): void
    {
        $actor = $this->admin();
        $student = $this->makeStudent();

        $this->actingAs($actor)->patch("/students/{$student->id}", $this->payload([
            'login_code' => 'ec-2026-7009',
            'student_number' => 'EC-2026-7001',
        ]));

        $account = $student->user->refresh();
        $this->assertSame('EC-2026-7009', $account->login_code);
        $this->assertTrue($account->matchesLoginCode('EC-2026-7009'));
    }

    public function test_a_short_numeric_code_is_accepted_and_arabic_digits_are_folded(): void
    {
        $actor = $this->admin();

        $this->actingAs($actor)->post('/students', $this->payload([
            'login_code' => '١٢٣',
            'student_number' => 'EC-2026-7010',
        ]))->assertSessionMissing('errors');

        $account = User::where('login_code', '123')->first();
        $this->assertNotNull($account);
        $this->assertTrue($account->matchesLoginCode('123'));
        $this->assertTrue($account->matchesLoginCode('١٢٣'));

        $this->actingAs($actor)->post('/students', $this->payload([
            'login_code' => '12',
            'student_number' => 'EC-2026-7011',
        ]))->assertSessionHasErrors('login_code');
    }

    public function test_search_matches_the_arabic_name_and_the_login_code(): void
    {
        $actor = $this->admin();
        $this->makeStudent(['login_code' => 'EC-2026-9001']);
        $this->makeStudent([
            'student_number' => 'EC-2026-7002',
            'login_code' => 'EC-2026-9002',
            'first_name' => 'Amina',
            'last_name' => 'Test',
            'first_name_ar' => 'أمينة',
        ]);

        $this->actingAs($actor)->get('/students?search=أمينة')
            ->assertInertia(fn ($page) => $page
                ->has('students.data', 1)
                ->where('students.data.0.studentNumber', 'EC-2026-7002')
            );

        $this->actingAs($actor)->get('/students?search=EC-2026-9002')
            ->assertInertia(fn ($page) => $page
                ->has('students.data', 1)
                ->where('students.data.0.loginCode', 'EC-2026-9002')
            );
    }

    public function test_a_file_keeps_its_category_in_the_choices_after_the_category_is_switched_off(): void
    {
        $actor = $this->admin();
        $student = $this->makeStudent();
        $this->category()->update(['is_active' => false]);

        $this->actingAs($actor)->get("/students/{$student->id}/edit")
            ->assertInertia(fn ($page) => $page
                ->has('categories', 1)
                ->where('student.licenseCategoryId', $this->category()->id)
            );

        $this->actingAs($actor)->get('/students/create')
            ->assertInertia(fn ($page) => $page->has('categories', 0));
    }
}
