<?php

namespace Tests\Feature\Admin;

use App\Models\AnswerOption;
use App\Models\Exam;
use App\Models\ExamQuestion;
use App\Models\LicenseCategory;
use App\Models\OptionTranslation;
use App\Models\Question;
use App\Models\QuestionTranslation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class QuestionsBankTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create([
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

    /**
     * @param  array<int, array{fr:string,ar:string}>  $options
     * @param  array<int, int>  $correct
     */
    private function payload(array $overrides = [], array $options = [], array $correct = [0]): array
    {
        return $overrides + [
            'question_fr' => 'Quelle est la vitesse maximale en ville ?',
            'question_ar' => 'ما هي السرعة القصوى داخل المدينة؟',
            'license_category_id' => '',
            'time_limit_seconds' => '30',
            'options' => $options === [] ? [
                ['fr' => '50 km/h', 'ar' => '٥٠ كلم/س'],
                ['fr' => '70 km/h', 'ar' => '٧٠ كلم/س'],
                ['fr' => '', 'ar' => ''],
                ['fr' => '', 'ar' => ''],
            ] : $options,
            'correct' => $correct,
        ];
    }

    private function question(array $overrides = [], array $options = [], array $correct = [0]): Question
    {
        $this->actingAs($this->admin())
            ->post('/questions', $this->payload($overrides, $options, $correct))
            ->assertRedirect(route('questions.index'))
            ->assertSessionHasNoErrors();

        return Question::latest('id')->firstOrFail();
    }

    public function test_guests_are_sent_to_the_login_page(): void
    {
        $this->get('/questions')->assertRedirect(route('login'));
        $this->post('/questions', $this->payload())->assertRedirect(route('login'));
        $this->assertDatabaseCount('questions', 0);
    }

    public function test_students_cannot_open_the_question_bank(): void
    {
        $student = User::factory()->create(['role' => 'student']);
        $question = $this->question();

        $this->actingAs($student)->get('/questions')->assertRedirect(route('student.dashboard'));
        $this->actingAs($student)->get("/questions/{$question->id}/edit")->assertRedirect(route('student.dashboard'));
        $this->actingAs($student)->delete("/questions/{$question->id}")->assertRedirect(route('student.dashboard'));
    }

    public function test_a_question_can_be_created_without_a_category(): void
    {
        $question = $this->question();

        $this->assertNull($question->license_category_id);
        $this->assertSame(30, $question->time_limit_seconds);
        $this->assertSame('single_choice', $question->question_type);
        $this->assertTrue($question->is_active);

        $this->assertSame('Quelle est la vitesse maximale en ville ?', $question->textFor('fr'));
        $this->assertSame('ما هي السرعة القصوى داخل المدينة؟', $question->textFor('ar'));
    }

    public function test_a_category_is_optional_but_has_to_exist(): void
    {
        $actor = $this->admin();
        $category = $this->category();

        $this->actingAs($actor)->post('/questions', $this->payload(['license_category_id' => (string) $category->id]))
            ->assertSessionHasNoErrors();

        $this->assertSame($category->id, Question::latest('id')->firstOrFail()->license_category_id);

        $this->actingAs($actor)->post('/questions', $this->payload(['license_category_id' => 4040]))
            ->assertSessionHasErrors('license_category_id');

        $this->assertSame(1, Question::count());
    }

    public function test_only_the_two_filled_choices_are_stored(): void
    {
        $question = $this->question();

        $this->assertSame(
            [['A', '50 km/h', '٥٠ كلم/س', true], ['B', '70 km/h', '٧٠ كلم/س', false]],
            $question->options()->orderBy('sort_order')->get()
                ->map(fn (AnswerOption $option) => [
                    $option->option_key,
                    $option->textFor('fr'),
                    $option->textFor('ar'),
                    $option->is_correct,
                ])
                ->all()
        );

        $this->assertSame(2, QuestionTranslation::count());
        $this->assertSame(4, OptionTranslation::count());
    }

    public function test_several_ticks_make_the_question_a_multiple_choice_one(): void
    {
        $question = $this->question(
            [],
            [
                ['fr' => 'Le clignotant', 'ar' => 'ال إشارة'],
                ['fr' => 'Le klaxon', 'ar' => 'البوق'],
                ['fr' => 'Les feux', 'ar' => 'الأضواء'],
                ['fr' => '', 'ar' => ''],
            ],
            [0, 2],
        );

        $this->assertSame('multiple_choice', $question->question_type);
        $this->assertSame(['A', 'C'], $question->options()->where('is_correct', true)->orderBy('sort_order')->pluck('option_key')->all());

        $this->actingAs($this->admin())->get('/questions')
            ->assertInertia(fn ($page) => $page
                ->where('questions.data.0.multiple', true)
                ->where('questions.data.0.correct.0', 'A')
                ->where('questions.data.0.correct.1', 'C')
            );
    }

    public function test_the_whole_minute_range_is_allowed(): void
    {
        $this->assertSame(600, $this->question(['time_limit_seconds' => '600'])->time_limit_seconds);
        $this->assertSame(1, $this->question(['time_limit_seconds' => '1'])->time_limit_seconds);
    }

    public function test_a_time_outside_the_allowed_range_is_rejected(): void
    {
        $actor = $this->admin();

        foreach (['0', '601', '-5', 'abc', ''] as $value) {
            $this->actingAs($actor)->post('/questions', $this->payload(['time_limit_seconds' => $value]))
                ->assertSessionHasErrors('time_limit_seconds');
        }

        $this->assertSame(0, Question::count());
    }

    public function test_the_language_nobody_wrote_copies_the_one_that_was(): void
    {
        $question = $this->question(['question_ar' => ''], [
            ['fr' => '50 km/h', 'ar' => '', 'prefix_fr' => 'a)'],
            ['fr' => '70 km/h', 'ar' => ''],
            ['fr' => '', 'ar' => ''],
            ['fr' => '', 'ar' => ''],
        ]);

        $this->assertSame('Quelle est la vitesse maximale en ville ?', $question->textFor('ar'));
        $this->assertSame($question->textFor('fr'), $question->textFor('ar'));

        $first = $question->options()->where('option_key', 'A')->firstOrFail();
        $second = $question->options()->where('option_key', 'B')->firstOrFail();

        $this->assertSame('50 km/h', $first->textFor('ar'));
        $this->assertSame('a)', $first->prefixFor('ar'));
        $this->assertSame('70 km/h', $second->textFor('ar'));
        // A choice written only in Arabic is copied the same way, in the other direction.
        $this->assertNull($second->prefixFor('fr'));

        $fromArabic = $this->question(['question_fr' => '', 'question_ar' => 'ما هي السرعة القصوى؟'], [
            ['fr' => '', 'ar' => 'صحيح'],
            ['fr' => '', 'ar' => 'خطأ'],
            ['fr' => '', 'ar' => ''],
            ['fr' => '', 'ar' => ''],
        ]);

        $this->assertSame('ما هي السرعة القصوى؟', $fromArabic->textFor('fr'));
        $this->assertSame(['صحيح', 'خطأ'], $fromArabic->options()->orderBy('sort_order')
            ->get()->map(fn ($option) => $option->textFor('fr'))->all());
    }

    public function test_a_question_written_in_no_language_at_all_is_refused(): void
    {
        $this->actingAs($this->admin())
            ->post('/questions', $this->payload(['question_fr' => '', 'question_ar' => '']))
            ->assertSessionHasErrors(['question_fr', 'question_ar']);

        $this->assertSame(0, Question::count());
    }

    public function test_a_question_needs_at_least_two_choices(): void
    {
        $this->actingAs($this->admin())
            ->post('/questions', $this->payload([], [
                ['fr' => 'Vrai', 'ar' => 'صحيح'],
                ['fr' => '', 'ar' => ''],
                ['fr' => '', 'ar' => ''],
                ['fr' => '', 'ar' => ''],
            ]))
            ->assertSessionHasErrors('options');
    }

    public function test_the_choices_fill_from_the_first_slot(): void
    {
        $this->actingAs($this->admin())
            ->post('/questions', $this->payload([], [
                ['fr' => 'Vrai', 'ar' => 'صحيح'],
                ['fr' => '', 'ar' => ''],
                ['fr' => 'Faux', 'ar' => 'خطأ'],
                ['fr' => '', 'ar' => ''],
            ], [0, 2]))
            ->assertSessionHasErrors('options');
    }

    public function test_an_answer_has_to_be_one_of_the_filled_choices(): void
    {
        $this->actingAs($this->admin())
            ->post('/questions', $this->payload([], [], [2]))
            ->assertSessionHasErrors('correct');

        $this->assertSame(0, Question::count());
    }

    public function test_everything_is_written_or_nothing(): void
    {
        // A tick on a slot nobody filled fails after the question row would exist, so the whole
        // write has to roll back rather than leave an answer-less question behind.
        $this->actingAs($this->admin())->post('/questions', $this->payload([], [], [3]));

        $this->assertSame(0, Question::count());
        $this->assertSame(0, QuestionTranslation::count());
        $this->assertSame(0, AnswerOption::count());
    }

    public function test_the_four_media_slots_are_stored_and_served(): void
    {
        Storage::fake('local');
        $actor = $this->admin();

        $this->actingAs($actor)->post('/questions', $this->payload([
            'image_ar' => UploadedFile::fake()->image('panneau-ar.png'),
            'image_fr' => UploadedFile::fake()->image('panneau-fr.png'),
            'audio_ar' => UploadedFile::fake()->create('signal-ar.mp3', 64, 'audio/mpeg'),
            'audio_fr' => UploadedFile::fake()->create('signal-fr.mp3', 64, 'audio/mpeg'),
        ]))->assertSessionHasNoErrors();

        $question = Question::latest('id')->firstOrFail();

        foreach (['image_ar', 'image_fr', 'audio_ar', 'audio_fr'] as $slot) {
            $this->assertNotNull($question->{$slot});
            Storage::disk('local')->assertExists($question->{$slot});
            $this->actingAs($actor)->get(route('questions.media', [$question, $slot]))->assertOk();
        }
    }

    public function test_a_media_slot_the_browser_left_empty_is_not_an_upload(): void
    {
        Storage::fake('local');

        // Inertia's formData writer turns a null file into an empty string, exactly like the
        // create form does when nobody attaches a picture.
        $question = $this->question([
            'image_ar' => '',
            'image_fr' => '',
            'audio_ar' => '',
            'audio_fr' => '',
            'remove_image_ar' => '0',
            'remove_image_fr' => '0',
            'remove_audio_ar' => '0',
            'remove_audio_fr' => '0',
        ]);

        foreach (['image_ar', 'image_fr', 'audio_ar', 'audio_fr'] as $slot) {
            $this->assertNull($question->{$slot});
        }
    }

    public function test_the_bank_shows_which_slots_are_filled(): void
    {
        Storage::fake('local');

        $this->question([
            'image_fr' => UploadedFile::fake()->image('panneau.png'),
            'audio_ar' => UploadedFile::fake()->create('signal.mp3', 64, 'audio/mpeg'),
        ]);

        $this->actingAs($this->admin())->get('/questions')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Questions/Index')
                ->where('stats.total', 1)
                ->where('stats.recorded', 1)
                ->where('questions.data.0.media.imageAr', null)
                ->has('questions.data.0.media.imageFr')
                ->has('questions.data.0.media.audioAr')
                ->where('questions.data.0.media.audioFr', null)
            );
    }

    public function test_a_picture_slot_refuses_a_sound_and_vice_versa(): void
    {
        Storage::fake('local');
        $actor = $this->admin();

        $this->actingAs($actor)->post('/questions', $this->payload([
            'image_ar' => UploadedFile::fake()->create('panneau.pdf', 8, 'application/pdf'),
        ]))->assertSessionHasErrors('image_ar');

        $this->actingAs($actor)->post('/questions', $this->payload([
            'audio_fr' => UploadedFile::fake()->image('signal.png'),
        ]))->assertSessionHasErrors('audio_fr');

        $this->assertSame(0, Question::count());
    }

    public function test_media_can_be_replaced_and_the_old_file_is_removed(): void
    {
        Storage::fake('local');
        $actor = $this->admin();
        $question = $this->question(['image_fr' => UploadedFile::fake()->image('first.png')]);

        $first = $question->image_fr;

        // A multipart body is only parsed by PHP on POST, so the form rides on method spoofing.
        $this->actingAs($actor)->post("/questions/{$question->id}", $this->payload([
            '_method' => 'patch',
            'image_fr' => UploadedFile::fake()->image('second.png'),
        ]))->assertSessionHasNoErrors();

        $question->refresh();
        $this->assertNotSame($first, $question->image_fr);
        Storage::disk('local')->assertMissing($first);
        Storage::disk('local')->assertExists($question->image_fr);
    }

    public function test_a_media_slot_can_be_emptied(): void
    {
        Storage::fake('local');
        $actor = $this->admin();
        $question = $this->question(['audio_ar' => UploadedFile::fake()->create('signal.mp3', 64, 'audio/mpeg')]);

        $path = $question->audio_ar;

        $this->actingAs($actor)->patch("/questions/{$question->id}", $this->payload(['remove_audio_ar' => true]));

        $this->assertNull($question->refresh()->audio_ar);
        Storage::disk('local')->assertMissing($path);
    }

    public function test_files_stay_put_when_a_question_is_edited_without_them(): void
    {
        Storage::fake('local');
        $actor = $this->admin();
        $question = $this->question(['image_ar' => UploadedFile::fake()->image('panneau.png')]);

        $path = $question->image_ar;

        $this->actingAs($actor)->patch("/questions/{$question->id}", $this->payload([
            'question_fr' => 'Vitesse sur autoroute ?',
        ]));

        $question->refresh();
        $this->assertSame('Vitesse sur autoroute ?', $question->textFor('fr'));
        $this->assertSame($path, $question->image_ar);
        Storage::disk('local')->assertExists($path);
    }

    public function test_the_edit_screen_carries_the_stored_question(): void
    {
        Storage::fake('local');
        $actor = $this->admin();
        $category = $this->category(['code' => 'B']);
        $question = $this->question(['license_category_id' => (string) $category->id]);

        $this->actingAs($actor)->get("/questions/{$question->id}/edit")
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Questions/Form')
                ->where('question.id', $question->id)
                ->where('question.textFr', 'Quelle est la vitesse maximale en ville ?')
                ->where('question.categoryCode', 'B')
                ->where('question.timeSeconds', 30)
                ->has('question.choices', 2)
                ->where('question.correct.0', 'A')
                ->where('question.media.imageFr', null)
                ->has('categories', 1)
            );
    }

    public function test_emptying_a_choice_drops_its_row_and_renumbers_the_rest(): void
    {
        $actor = $this->admin();
        $question = $this->question([], [
            ['fr' => 'Un', 'ar' => 'واحد'],
            ['fr' => 'Deux', 'ar' => 'اثنان'],
            ['fr' => 'Trois', 'ar' => 'ثلاثة'],
            ['fr' => '', 'ar' => ''],
        ], [1]);

        $this->actingAs($actor)->patch("/questions/{$question->id}", $this->payload([], [
            ['fr' => 'Un', 'ar' => 'واحد'],
            ['fr' => 'Deux', 'ar' => 'اثنان'],
            ['fr' => '', 'ar' => ''],
            ['fr' => '', 'ar' => ''],
        ], [0]))->assertSessionHasNoErrors();

        $kept = $question->options()->orderBy('sort_order')->get();

        $this->assertSame(['A', 'B'], $kept->pluck('option_key')->all());
        $this->assertSame([1, 2], $kept->pluck('sort_order')->all());
        $this->assertSame([true, false], $kept->pluck('is_correct')->all());
        $this->assertSame(4, OptionTranslation::count());
        $this->assertSame('single_choice', $question->refresh()->question_type);
    }

    public function test_a_question_is_archived_and_restored_by_its_endpoint(): void
    {
        $actor = $this->admin();
        $question = $this->question();

        $this->actingAs($actor)->patch("/questions/{$question->id}/active")->assertRedirect();
        $this->assertFalse($question->refresh()->is_active);

        $this->actingAs($actor)->patch("/questions/{$question->id}/active");
        $this->assertTrue($question->refresh()->is_active);
    }

    public function test_a_choice_can_carry_text_in_front_of_it(): void
    {
        $actor = $this->admin();
        $question = $this->question([], [
            ['fr' => '50 km/h', 'ar' => '٥٠ كلم/س', 'prefix_fr' => 'a)', 'prefix_ar' => 'أ)'],
            ['fr' => '70 km/h', 'ar' => '٧٠ كلم/س', 'prefix_fr' => '  ', 'prefix_ar' => ''],
            ['fr' => '', 'ar' => ''],
            ['fr' => '', 'ar' => ''],
        ]);

        $first = $question->options()->where('option_key', 'A')->firstOrFail();
        $second = $question->options()->where('option_key', 'B')->firstOrFail();

        $this->assertSame('a)', $first->prefixFor('fr'));
        $this->assertSame('أ)', $first->prefixFor('ar'));
        // Spaces are not a lead-in, and a slot that never sent one is not an error either.
        $this->assertNull($second->prefixFor('fr'));
        $this->assertNull($second->prefixFor('ar'));

        $this->actingAs($actor)->get("/questions/{$question->id}/edit")
            ->assertInertia(fn ($page) => $page->where('question.choices.0.prefixFr', 'a)'));

        $this->actingAs($actor)->patch("/questions/{$question->id}", $this->payload([], [
            ['fr' => '50 km/h', 'ar' => '٥٠ كلم/س', 'prefix_fr' => '', 'prefix_ar' => ''],
            ['fr' => '70 km/h', 'ar' => '٧٠ كلم/س'],
            ['fr' => '', 'ar' => ''],
            ['fr' => '', 'ar' => ''],
        ]))->assertSessionHasNoErrors();

        $this->assertNull($first->refresh()->prefixFor('fr'));

        $this->actingAs($actor)->post('/questions', $this->payload([], [
            ['fr' => '50 km/h', 'ar' => '٥٠ كلم/س', 'prefix_fr' => str_repeat('a', 61)],
            ['fr' => '70 km/h', 'ar' => '٧٠ كلم/س'],
            ['fr' => '', 'ar' => ''],
            ['fr' => '', 'ar' => ''],
        ]))->assertSessionHasErrors('options.0.prefix_fr');
    }

    public function test_saving_a_question_leaves_its_archive_alone(): void
    {
        $actor = $this->admin();
        $question = $this->question();
        $question->update(['is_active' => false]);

        // The form has no active switch any more, so rewriting the wording cannot quietly put an
        // archived question back into the pool, even from a stale tab that still sends the field.
        $this->actingAs($actor)->patch("/questions/{$question->id}", $this->payload(['is_active' => '1']))
            ->assertRedirect(route('questions.index'))->assertSessionHasNoErrors();
        $this->assertFalse($question->refresh()->is_active);

        // A question nobody ticks on the form still starts life in the pool.
        $this->actingAs($actor)->post('/questions', $this->payload());
        $this->assertTrue(Question::latest('id')->first()->is_active);
    }

    public function test_an_unused_question_can_be_deleted_with_its_files(): void
    {
        Storage::fake('local');
        $actor = $this->admin();
        $question = $this->question(['image_fr' => UploadedFile::fake()->image('panneau.png')]);

        $path = $question->image_fr;

        $this->actingAs($actor)->delete("/questions/{$question->id}")
            ->assertRedirect(route('questions.index'))->assertSessionHas('success', 'deleted');

        $this->assertNull(Question::find($question->id));
        Storage::disk('local')->assertMissing($path);
        $this->assertSame(0, AnswerOption::count());
    }

    public function test_a_question_already_used_by_an_exam_is_not_deleted(): void
    {
        $actor = $this->admin();
        $question = $this->question();

        $exam = Exam::create([
            'license_category_id' => $this->category()->id,
            'created_by' => $actor->id,
            'title_ar' => 'امتحان',
            'title_fr' => 'Examen blanc',
            'status' => 'draft',
        ]);

        ExamQuestion::create(['exam_id' => $exam->id, 'question_id' => $question->id, 'question_order' => 1]);

        $this->actingAs($actor)->delete("/questions/{$question->id}")->assertSessionHasErrors('questions');

        $this->assertTrue(Question::find($question->id)->exists());
    }

    public function test_the_media_route_refuses_an_unknown_slot_and_a_missing_file(): void
    {
        Storage::fake('local');
        $actor = $this->admin();
        $question = $this->question();

        $this->actingAs($actor)->get(route('questions.media', [$question, 'image_ar']))->assertNotFound();
        $this->actingAs($actor)->get(route('questions.media', [$question, 'explanation_fr']))->assertNotFound();
    }

    public function test_search_matches_both_languages_and_escapes_wildcards(): void
    {
        $actor = $this->admin();
        $this->question(['question_fr' => 'Le clignotant sert à']);
        $this->question(['question_ar' => 'البوق ممنوع داخل المدينة']);

        $this->actingAs($actor)->get('/questions?search=clignotant')
            ->assertInertia(fn ($page) => $page->has('questions.data', 1));

        $this->actingAs($actor)->get('/questions?search=البوق')
            ->assertInertia(fn ($page) => $page
                ->has('questions.data', 1)
                ->where('questions.data.0.textAr', 'البوق ممنوع داخل المدينة')
            );

        $this->actingAs($actor)->get('/questions?search=%25')
            ->assertInertia(fn ($page) => $page->has('questions.data', 0));
    }

    public function test_the_filters_narrow_the_list(): void
    {
        $actor = $this->admin();
        $category = $this->category(['code' => 'B']);

        $single = $this->question(['license_category_id' => (string) $category->id, 'time_limit_seconds' => '10']);
        $multiple = $this->question([], [
            ['fr' => 'Un', 'ar' => 'واحد'],
            ['fr' => 'Deux', 'ar' => 'اثنان'],
            ['fr' => '', 'ar' => ''],
            ['fr' => '', 'ar' => ''],
        ], [0, 1]);

        $this->actingAs($actor)->patch("/questions/{$multiple->id}/active");

        Storage::fake('local');
        $this->actingAs($actor)->patch("/questions/{$single->id}", $this->payload([
            'license_category_id' => (string) $category->id,
            'image_fr' => UploadedFile::fake()->image('panneau.png'),
        ]));

        $this->actingAs($actor)->get('/questions?answer=multiple')
            ->assertInertia(fn ($page) => $page->has('questions.data', 1)->where('questions.data.0.id', $multiple->id));

        $this->actingAs($actor)->get('/questions?status=active')
            ->assertInertia(fn ($page) => $page->has('questions.data', 1)->where('questions.data.0.id', $single->id));

        $this->actingAs($actor)->get('/questions?media=image')
            ->assertInertia(fn ($page) => $page->has('questions.data', 1));

        $this->actingAs($actor)->get('/questions?media=none')
            ->assertInertia(fn ($page) => $page->has('questions.data', 1)->where('questions.data.0.id', $multiple->id));

        $this->actingAs($actor)->get('/questions?category='.$category->id)
            ->assertInertia(fn ($page) => $page->has('questions.data', 1));

        $this->actingAs($actor)->get('/questions?category=none')
            ->assertInertia(fn ($page) => $page->has('questions.data', 1)->where('questions.data.0.id', $multiple->id));

        $this->actingAs($actor)->get('/questions?answer=bogus&status=bogus&media=bogus')
            ->assertInertia(fn ($page) => $page
                ->has('questions.data', 2)
                ->where('filters.answer', null)
                ->where('filters.status', null)
                ->where('filters.media', null)
            );
    }

    public function test_the_list_can_be_sorted_by_the_time_limit(): void
    {
        $actor = $this->admin();
        $this->question(['time_limit_seconds' => '10']);
        $this->question(['time_limit_seconds' => '90']);

        $this->actingAs($actor)->get('/questions?sort=time_limit_seconds&direction=asc')
            ->assertInertia(fn ($page) => $page
                ->where('questions.data.0.timeSeconds', 10)
                ->where('questions.data.1.timeSeconds', 90)
                ->where('filters.sort', 'time_limit_seconds')
                ->where('filters.direction', 'asc')
            );

        $this->actingAs($actor)->get('/questions?sort=title&direction=bogus')
            ->assertInertia(fn ($page) => $page
                ->where('filters.sort', 'created_at')
                ->where('filters.direction', 'desc')
            );
    }

    public function test_the_list_shows_the_exam_count(): void
    {
        $actor = $this->admin();
        $question = $this->question();
        $category = $this->category();

        $exam = Exam::create([
            'license_category_id' => $category->id,
            'created_by' => $actor->id,
            'title_ar' => 'امتحان',
            'title_fr' => 'Examen',
            'status' => 'draft',
        ]);

        ExamQuestion::create(['exam_id' => $exam->id, 'question_id' => $question->id, 'question_order' => 1]);

        $this->actingAs($actor)->get('/questions')
            ->assertInertia(fn ($page) => $page->where('questions.data.0.examsCount', 1));
    }
}
