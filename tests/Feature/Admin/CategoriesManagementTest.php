<?php

namespace Tests\Feature\Admin;

use App\Models\Exam;
use App\Models\LicenseCategory;
use App\Models\Question;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class CategoriesManagementTest extends TestCase
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

    private function category(array $attributes = []): LicenseCategory
    {
        return LicenseCategory::create($attributes + [
            'code' => 'B'.str_pad((string) random_int(0, 99999), 5, '0', STR_PAD_LEFT),
            'name_fr' => 'Voiture légère',
            'name_ar' => 'سيارة خفيفة',
            'is_active' => true,
        ]);
    }

    private function student(User $account, LicenseCategory $category): Student
    {
        return Student::create([
            'user_id' => $account->id,
            'license_category_id' => $category->id,
            'student_number' => 'EC-2026-'.random_int(1000, 9999),
            'status' => 'active',
            'enrollment_date' => now()->toDateString(),
        ]);
    }

    public function test_students_cannot_open_the_categories_screen(): void
    {
        $student = User::factory()->create(['role' => 'student']);

        $this->actingAs($student)->get('/categories')->assertRedirect(route('student.dashboard'));
    }

    public function test_guests_are_sent_to_the_login_page(): void
    {
        $this->get('/categories')->assertRedirect(route('login'));
    }

    public function test_admins_see_the_category_list_with_usage_counts(): void
    {
        $actor = $this->admin();
        $category = $this->category(['code' => 'B']);
        $this->student(User::factory()->create(['role' => 'student']), $category);
        $this->category(['code' => 'C']);

        $this->actingAs($actor)->get('/categories')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('stats.total', 2)
                ->where('stats.active', 2)
                ->where('stats.trainees', 1)
                ->has('categories', 2)
                ->where('categories.0.code', 'B')
                ->where('categories.0.studentsCount', 1)
                ->where('categories.0.examsCount', 0)
            );
    }

    public function test_the_list_carries_every_field_the_form_modal_needs(): void
    {
        $actor = $this->admin();
        $this->category([
            'code' => 'B',
            'description_fr' => '18 ans et plus',
            'description_ar' => '18 سنة وما فوق',
            'is_active' => false,
        ]);

        $this->actingAs($actor)->get('/categories')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Categories/Index')
                ->where('categories.0.nameFr', 'Voiture légère')
                ->where('categories.0.nameAr', 'سيارة خفيفة')
                ->where('categories.0.conditionFr', '18 ans et plus')
                ->where('categories.0.conditionAr', '18 سنة وما فوق')
                ->where('categories.0.iconUrl', null)
                ->where('categories.0.isActive', false)
            );
    }

    public function test_a_category_can_be_created(): void    {
        $actor = $this->admin();

        $this->actingAs($actor)->post('/categories', [
            'code' => 'ac',
            'name_fr' => 'Camion',
            'name_ar' => 'شاحنة',
            'condition_fr' => 'Poids lourd',
            'condition_ar' => 'شاحنة ثقيلة',
            'is_active' => true,
        ])->assertRedirect(route('categories.index'))->assertSessionHas('success', 'created');

        $category = LicenseCategory::where('name_fr', 'Camion')->firstOrFail();
        $this->assertSame('AC', $category->code);
        $this->assertSame('Poids lourd', $category->description_fr);
        $this->assertSame('شاحنة ثقيلة', $category->description_ar);
        $this->assertTrue($category->is_active);
    }

    public function test_a_category_can_be_created_with_an_icon(): void
    {
        Storage::fake('local');
        $actor = $this->admin();

        $this->actingAs($actor)->post('/categories', [
            'code' => 'A',
            'name_fr' => 'Moto',
            'name_ar' => 'دراجة',
            'icon' => UploadedFile::fake()->image('moto.png'),
            'is_active' => true,
        ])->assertRedirect(route('categories.index'));

        $category = LicenseCategory::where('code', 'A')->firstOrFail();
        Storage::disk('local')->assertExists($category->icon_path);

        $this->actingAs($actor)->get(route('categories.icon', $category))->assertOk();
    }

    public function test_an_invalid_icon_is_rejected_without_writing_the_category(): void
    {
        Storage::fake('local');
        $actor = $this->admin();

        $this->actingAs($actor)->post('/categories', [
            'code' => 'A',
            'name_fr' => 'Moto',
            'name_ar' => 'دراجة',
            'icon' => UploadedFile::fake()->create('moto.pdf', 12, 'application/pdf'),
            'is_active' => true,
        ])->assertSessionHasErrors('icon');

        $this->assertFalse(LicenseCategory::where('code', 'A')->exists());
    }

    public function test_a_category_can_be_created_inactive(): void
    {
        $actor = $this->admin();

        $this->actingAs($actor)->post('/categories', [
            'code' => 'D',
            'name_fr' => 'Moto',
            'name_ar' => 'دراجة',
            'is_active' => false,
        ]);

        $this->assertFalse(LicenseCategory::where('code', 'D')->firstOrFail()->is_active);
    }

    public function test_a_category_created_without_the_availability_field_is_active(): void
    {
        $actor = $this->admin();

        $this->actingAs($actor)->post('/categories', [
            'code' => 'E',
            'name_fr' => 'Vélo',
            'name_ar' => 'دراجة هوائية',
        ])->assertSessionHas('success', 'created');

        $this->assertTrue(LicenseCategory::where('code', 'E')->firstOrFail()->is_active);
    }

    public function test_editing_a_category_without_the_availability_field_keeps_the_flag(): void
    {
        $actor = $this->admin();
        $category = $this->category(['code' => 'B', 'is_active' => false]);

        $this->actingAs($actor)->patch("/categories/{$category->id}", [
            'code' => 'B',
            'name_fr' => 'Voiture',
            'name_ar' => 'سيارة',
        ])->assertSessionHas('success', 'updated');

        $this->assertFalse($category->refresh()->is_active);
    }

    public function test_the_arabic_name_is_required(): void
    {
        $actor = $this->admin();

        $this->actingAs($actor)->post('/categories', [
            'code' => 'E',
            'name_fr' => 'Sans arabe',
        ])->assertSessionHasErrors('name_ar');

        $this->assertFalse(LicenseCategory::where('code', 'E')->exists());
    }

    public function test_a_code_cannot_be_reused(): void
    {
        $actor = $this->admin();
        $this->category(['code' => 'B']);

        $this->actingAs($actor)->post('/categories', [
            'code' => 'b',
            'name_fr' => 'Doublon',
            'name_ar' => 'مكرر',
            'is_active' => true,
        ])->assertSessionHasErrors('code');

        $this->assertSame(1, LicenseCategory::count());
    }

    public function test_a_category_can_be_updated(): void
    {
        $actor = $this->admin();
        $category = $this->category(['code' => 'B']);

        $this->actingAs($actor)->patch("/categories/{$category->id}", [
            'code' => 'B1',
            'name_fr' => 'Voiture B1',
            'name_ar' => 'سيارة ب1',
            'condition_ar' => 'وصف',
            'is_active' => false,
        ])->assertRedirect(route('categories.index'))->assertSessionHas('success', 'updated');

        $category->refresh();
        $this->assertSame('B1', $category->code);
        $this->assertSame('Voiture B1', $category->name_fr);
        $this->assertSame('وصف', $category->description_ar);
        $this->assertFalse($category->is_active);
    }

    public function test_the_modal_sends_its_edit_as_a_post_with_a_spoofed_patch(): void
    {
        Storage::fake('local');
        $actor = $this->admin();
        $category = $this->category(['code' => 'B', 'is_active' => false]);

        // A multipart body is only parsed by PHP on POST, so the dialog rides on method spoofing
        // and sends every field as a string, exactly like the browser does.
        $this->actingAs($actor)->post("/categories/{$category->id}", [
            '_method' => 'patch',
            'code' => 'B',
            'name_fr' => 'Voiture B1',
            'name_ar' => 'سيارة ب1',
            'condition_fr' => '',
            'condition_ar' => '',
            'icon' => UploadedFile::fake()->image('b1.png'),
            'remove_icon' => '0',
        ])->assertRedirect(route('categories.index'))->assertSessionHas('success', 'updated');

        $category->refresh();
        $this->assertSame('Voiture B1', $category->name_fr);
        $this->assertNull($category->description_fr);
        $this->assertFalse($category->is_active);
        Storage::disk('local')->assertExists($category->icon_path);
    }

    public function test_an_icon_can_be_replaced_and_the_old_file_is_removed(): void
    {
        Storage::fake('local');
        $actor = $this->admin();
        $category = $this->category(['code' => 'B']);

        $this->actingAs($actor)->patch("/categories/{$category->id}", [
            'code' => 'B',
            'name_fr' => 'Voiture légère',
            'name_ar' => 'سيارة خفيفة',
            'icon' => UploadedFile::fake()->image('first.png'),
            'is_active' => true,
        ]);

        $first = $category->refresh()->icon_path;
        Storage::disk('local')->assertExists($first);

        $this->actingAs($actor)->patch("/categories/{$category->id}", [
            'code' => 'B',
            'name_fr' => 'Voiture légère',
            'name_ar' => 'سيارة خفيفة',
            'icon' => UploadedFile::fake()->image('second.png'),
            'is_active' => true,
        ]);

        $second = $category->refresh()->icon_path;
        $this->assertNotSame($first, $second);
        Storage::disk('local')->assertMissing($first);
        Storage::disk('local')->assertExists($second);
    }

    public function test_an_icon_can_be_removed(): void
    {
        Storage::fake('local');
        $actor = $this->admin();
        $category = $this->category(['code' => 'B']);

        $this->actingAs($actor)->patch("/categories/{$category->id}", [
            'code' => 'B',
            'name_fr' => 'Voiture légère',
            'name_ar' => 'سيارة خفيفة',
            'icon' => UploadedFile::fake()->image('first.png'),
            'is_active' => true,
        ]);

        $path = $category->refresh()->icon_path;

        $this->actingAs($actor)->patch("/categories/{$category->id}", [
            'code' => 'B',
            'name_fr' => 'Voiture légère',
            'name_ar' => 'سيارة خفيفة',
            'remove_icon' => true,
            'is_active' => true,
        ]);

        $this->assertNull($category->refresh()->icon_path);
        Storage::disk('local')->assertMissing($path);
    }

    public function test_an_icon_does_not_change_when_the_category_is_edited_without_one(): void
    {
        Storage::fake('local');
        $actor = $this->admin();
        $category = $this->category(['code' => 'B']);

        $this->actingAs($actor)->patch("/categories/{$category->id}", [
            'code' => 'B',
            'name_fr' => 'Voiture légère',
            'name_ar' => 'سيارة خفيفة',
            'icon' => UploadedFile::fake()->image('first.png'),
            'is_active' => true,
        ]);

        $path = $category->refresh()->icon_path;

        $this->actingAs($actor)->patch("/categories/{$category->id}", [
            'code' => 'B',
            'name_fr' => 'Renommée',
            'name_ar' => 'سيارة خفيفة',
            'is_active' => true,
        ]);

        $this->assertSame($path, $category->refresh()->icon_path);
        Storage::disk('local')->assertExists($path);
    }

    public function test_the_list_exposes_the_icon_url(): void
    {
        Storage::fake('local');
        $actor = $this->admin();
        $category = $this->category(['code' => 'B']);

        $this->actingAs($actor)->patch("/categories/{$category->id}", [
            'code' => 'B',
            'name_fr' => 'Voiture légère',
            'name_ar' => 'سيارة خفيفة',
            'icon' => UploadedFile::fake()->image('first.png'),
            'is_active' => true,
        ]);

        $this->actingAs($actor)->get('/categories')
            ->assertInertia(fn ($page) => $page
                ->where('categories.0.code', 'B')
                ->has('categories.0.iconUrl')
            );
    }

    public function test_the_icon_route_is_missing_for_a_category_without_one(): void
    {
        $actor = $this->admin();
        $category = $this->category(['code' => 'B']);

        $this->actingAs($actor)->get(route('categories.icon', $category))->assertNotFound();
    }

    public function test_deleting_a_category_removes_its_icon_file(): void
    {
        Storage::fake('local');
        $actor = $this->admin();
        $category = $this->category(['code' => 'B']);

        $this->actingAs($actor)->patch("/categories/{$category->id}", [
            'code' => 'B',
            'name_fr' => 'Voiture légère',
            'name_ar' => 'سيارة خفيفة',
            'icon' => UploadedFile::fake()->image('first.png'),
            'is_active' => true,
        ]);

        $path = $category->refresh()->icon_path;

        $this->actingAs($actor)->delete("/categories/{$category->id}")->assertRedirect(route('categories.index'));

        Storage::disk('local')->assertMissing($path);
    }

    public function test_keeping_the_own_code_on_update_is_allowed(): void
    {
        $actor = $this->admin();
        $category = $this->category(['code' => 'B']);

        $this->actingAs($actor)->patch("/categories/{$category->id}", [
            'code' => 'B',
            'name_fr' => 'Renommé',
            'name_ar' => 'مسيّى',
            'is_active' => true,
        ])->assertSessionHasNoErrors();

        $this->assertSame('Renommé', $category->refresh()->name_fr);
    }

    public function test_a_category_can_be_toggled_from_the_list(): void
    {
        $actor = $this->admin();
        $category = $this->category();

        $this->actingAs($actor)->patch("/categories/{$category->id}/active")
            ->assertRedirect();
        $this->assertFalse($category->refresh()->is_active);

        $this->actingAs($actor)->patch("/categories/{$category->id}/active");
        $this->assertTrue($category->refresh()->is_active);
    }

    public function test_an_unused_category_can_be_deleted(): void
    {
        $actor = $this->admin();
        $category = $this->category();

        $this->actingAs($actor)->delete("/categories/{$category->id}")
            ->assertRedirect(route('categories.index'))->assertSessionHas('success', 'deleted');

        $this->assertNull(LicenseCategory::find($category->id));
    }

    public function test_a_category_used_by_a_pupil_is_deactivated_rather_than_deleted(): void
    {
        $actor = $this->admin();
        $category = $this->category();
        $this->student(User::factory()->create(['role' => 'student']), $category);

        $this->actingAs($actor)->delete("/categories/{$category->id}")
            ->assertSessionHasErrors('categories');

        $this->assertTrue(LicenseCategory::find($category->id)->exists());
    }

    public function test_a_category_used_by_an_exam_is_not_deleted(): void
    {
        $actor = $this->admin();
        $category = $this->category();

        Exam::create([
            'license_category_id' => $category->id,
            'created_by' => $actor->id,
            'title_ar' => 'امتحان',
            'title_fr' => 'Examen blanc',
            'status' => 'draft',
        ]);

        $this->actingAs($actor)->delete("/categories/{$category->id}")
            ->assertSessionHasErrors('categories');

        $this->assertTrue(LicenseCategory::find($category->id)->exists());
    }

    public function test_a_category_used_by_a_question_is_not_deleted(): void
    {
        $actor = $this->admin();
        $category = $this->category();

        Question::create([
            'license_category_id' => $category->id,
            'created_by' => $actor->id,
        ]);

        $this->actingAs($actor)->delete("/categories/{$category->id}")
            ->assertSessionHasErrors('categories');

        $this->assertTrue(LicenseCategory::find($category->id)->exists());
    }

    public function test_search_matches_the_code_and_both_names(): void
    {
        $actor = $this->admin();
        $this->category(['code' => 'A', 'name_fr' => 'Moto', 'name_ar' => 'دراجة']);
        $this->category(['code' => 'C', 'name_fr' => 'Camion', 'name_ar' => 'شاحنة']);

        $this->actingAs($actor)->get('/categories?search=cam')
            ->assertInertia(fn ($page) => $page->has('categories', 1)->where('categories.0.code', 'C'));

        $this->actingAs($actor)->get('/categories?search=دراجة')
            ->assertInertia(fn ($page) => $page->has('categories', 1)->where('categories.0.code', 'A'));

        $this->actingAs($actor)->get('/categories?search=c')
            ->assertInertia(fn ($page) => $page->has('categories', 1));
    }

    public function test_search_wildcards_are_treated_as_literals(): void
    {
        $actor = $this->admin();
        $this->category(['code' => 'A']);

        $this->actingAs($actor)->get('/categories?search=%25')
            ->assertInertia(fn ($page) => $page->has('categories', 0));
    }

    public function test_the_status_filter_narrows_the_list(): void
    {
        $actor = $this->admin();
        $this->category(['code' => 'A']);
        $this->category(['code' => 'B', 'is_active' => false]);

        $this->actingAs($actor)->get('/categories?status=active')
            ->assertInertia(fn ($page) => $page
                ->has('categories', 1)
                ->where('categories.0.code', 'A')
                ->where('filters.status', 'active')
            );

        $this->actingAs($actor)->get('/categories?status=bogus')
            ->assertInertia(fn ($page) => $page->has('categories', 2)->where('filters.status', null));
    }

    public function test_inactive_categories_are_hidden_from_the_pupils_screen(): void
    {
        $actor = $this->admin();
        $this->category(['code' => 'A', 'is_active' => false]);

        $this->actingAs($actor)->get('/students/create')
            ->assertInertia(fn ($page) => $page->has('categories', 0));
    }
}
