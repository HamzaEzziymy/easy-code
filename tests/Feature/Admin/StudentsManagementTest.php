<?php

namespace Tests\Feature\Admin;

use App\Models\Exam;
use App\Models\ExamAttempt;
use App\Models\LicenseCategory;
use App\Models\Student;
use App\Models\StudentAppointment;
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
            'name' => 'Youssef Test',
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
            'name' => 'Renamed Pupil',
            'birthplace' => 'Rabat',
            'login_code' => '',
            'student_number' => 'EC-2026-7001',
        ]))->assertRedirect(route('students.show', $student));

        $student->refresh();
        $this->assertSame('Renamed Pupil', $student->user->name);
        $this->assertSame('Rabat', $student->birthplace);
        $this->assertTrue($student->user->matchesLoginCode('EC-2026-7001'));
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

    public function test_a_file_with_history_cannot_be_deleted(): void
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

        StudentAppointment::create([
            'student_id' => $student->id,
            'exam_id' => $exam->id,
            'appointment_type' => 'exam',
            'scheduled_at' => now(),
            'status' => 'scheduled',
            'created_by' => $actor->id,
        ]);

        $this->actingAs($actor)->delete("/students/{$student->id}")->assertSessionHasErrors('students');

        $this->assertSame(1, Student::count());
        $this->assertTrue($student->user->refresh()->exists());
    }

    public function test_search_and_filters_narrow_the_list(): void
    {
        $actor = $this->admin();
        $this->makeStudent(['student_number' => 'EC-2026-7001', 'login_code' => 'EC-2026-7001', 'cin' => 'AA1']);
        $this->makeStudent(['student_number' => 'EC-2026-7002', 'login_code' => 'EC-2026-7002', 'cin' => 'BB2', 'status' => 'suspended']);

        $this->actingAs($actor)->get('/students?search=BB2')
            ->assertInertia(fn ($page) => $page->has('students.data', 1)->where('students.data.0.cin', 'BB2'));

        $this->actingAs($actor)->get('/students?status=suspended')
            ->assertInertia(fn ($page) => $page->has('students.data', 1)->where('students.total', 1));

        $this->actingAs($actor)->get("/students?category={$this->category()->id}")
            ->assertInertia(fn ($page) => $page->has('students.data', 2));

        $this->actingAs($actor)->get('/students?sort=student_number&direction=asc')
            ->assertInertia(fn ($page) => $page->where('students.data.0.studentNumber', 'EC-2026-7001'));
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
}
