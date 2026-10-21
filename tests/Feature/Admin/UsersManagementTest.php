<?php

namespace Tests\Feature\Admin;

use App\Models\LicenseCategory;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class UsersManagementTest extends TestCase
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

    public function test_students_cannot_open_the_users_screen(): void
    {
        $student = User::factory()->create(['role' => 'student']);

        $this->actingAs($student)->get('/users')->assertRedirect(route('student.dashboard'));
    }

    public function test_guests_are_sent_to_the_login_page(): void
    {
        $this->get('/users')->assertRedirect(route('login'));
    }

    public function test_the_list_only_contains_administrators(): void
    {
        $actor = $this->admin();
        User::factory()->create(['role' => 'student', 'name' => 'Pupil Hidden']);

        $this->actingAs($actor)
            ->get('/users')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('stats.total', 1)
                ->where('stats.active', 1)
                ->has('users.data', 1)
                ->where('users.data.0.name', $actor->name)
                ->has('users.links')
            );
    }

    public function test_an_admin_can_be_created(): void
    {
        $actor = $this->admin();

        $this->actingAs($actor)->post('/users', [
            'name' => 'New Admin',
            'email' => 'new.admin@example.com',
            'password' => 'secret123',
            'password_confirmation' => 'secret123',
        ])->assertRedirect(route('users.index'));

        $created = User::where('email', 'new.admin@example.com')->firstOrFail();
        $this->assertTrue($created->isAdmin());
        $this->assertNull($created->login_code_hash);
        $this->assertTrue($created->is_active);
    }

    public function test_an_admin_without_email_is_rejected(): void
    {
        $actor = $this->admin();

        $this->actingAs($actor)->post('/users', [
            'name' => 'Headless Admin',
            'password' => 'secret123',
            'password_confirmation' => 'secret123',
        ])->assertSessionHasErrors('email');
    }

    public function test_an_admin_without_password_is_rejected(): void
    {
        $actor = $this->admin();

        $this->actingAs($actor)->post('/users', [
            'name' => 'Passwordless Admin',
            'email' => 'passwordless@example.com',
        ])->assertSessionHasErrors('password');
    }

    public function test_blank_password_on_update_keeps_the_existing_one(): void
    {
        $actor = $this->admin();
        $target = $this->admin(['email' => 'keep@example.com', 'password' => 'original123']);

        $this->actingAs($actor)->patch("/users/{$target->id}", [
            'name' => 'Renamed Admin',
            'email' => 'keep@example.com',
            'password' => '',
            'password_confirmation' => '',
        ])->assertRedirect(route('users.index'));

        $target->refresh();
        $this->assertSame('Renamed Admin', $target->name);
        $this->assertTrue(Hash::check('original123', $target->password));
    }

    public function test_a_user_cannot_deactivate_their_own_account(): void
    {
        $actor = $this->admin();
        $this->admin(['email' => 'second@example.com']);

        $this->actingAs($actor)->patch("/users/{$actor->id}/active")
            ->assertSessionHasErrors('status');

        $this->assertTrue($actor->refresh()->is_active);
    }

    public function test_the_last_active_admin_cannot_be_deactivated(): void
    {
        $only = $this->admin();
        $observer = $this->admin(['email' => 'observer@example.com', 'is_active' => false]);

        $this->actingAs($observer)->patch("/users/{$only->id}/active")
            ->assertSessionHasErrors('status');

        $this->assertTrue($only->refresh()->is_active);
    }

    public function test_a_user_cannot_delete_their_own_account(): void
    {
        $actor = $this->admin();
        $this->admin(['email' => 'other@example.com']);

        $this->actingAs($actor)->delete("/users/{$actor->id}")->assertSessionHasErrors('users');
        $this->assertTrue($actor->refresh()->exists());
    }

    public function test_an_account_with_records_is_deactivated_rather_than_deleted(): void
    {
        $actor = $this->admin();
        $student = User::factory()->create(['role' => 'student', 'email' => 'pupil@example.com']);

        $category = LicenseCategory::create([
            'code' => 'B',
            'name_fr' => 'Voiture légère',
            'name_ar' => 'سيارة خفيفة',
        ]);

        Student::create([
            'user_id' => $student->id,
            'student_number' => 'EC-2026-500',
            'license_category_id' => $category->id,
            'status' => 'active',
            'phone' => '0500000000',
            'enrollment_date' => now()->toDateString(),
        ]);

        $this->actingAs($actor)->delete("/users/{$student->id}")->assertSessionHasErrors('users');
        $this->assertTrue($student->refresh()->exists());
    }

    public function test_search_and_status_filters_narrow_the_list(): void
    {
        $actor = $this->admin();
        $hidden = $this->admin(['email' => 'hidden@example.com', 'name' => 'Zinedine Admin', 'is_active' => false]);

        $this->actingAs($actor)->get('/users?search=zinedine')
            ->assertInertia(fn ($page) => $page->has('users.data', 1)->where('users.data.0.name', 'Zinedine Admin'));

        $this->actingAs($actor)->get('/users?status=active')
            ->assertInertia(fn ($page) => $page->has('users.data', 1)->where('users.total', 1));

        $this->actingAs($actor)->get('/users?status=inactive')
            ->assertInertia(fn ($page) => $page->has('users.data', 1)->where('users.data.0.id', $hidden->id));
    }
}
