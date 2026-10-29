<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AnswerOption;
use App\Models\LicenseCategory;
use App\Models\OptionTranslation;
use App\Models\Question;
use App\Models\QuestionTranslation;
use Closure;
use Illuminate\Database\QueryException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;
use Inertia\Inertia;
use Inertia\Response;

class QuestionController extends Controller
{
    /**
     * The four slots a question's choices fill, labelled A to D the way the exam screen shows them.
     */
    private const KEYS = ['A', 'B', 'C', 'D'];

    /**
     * A question carries its own picture and sound per language, because both hold text or a voice
     * the trainee reads in the language of the exam they sit.
     */
    private const MEDIA = ['image_ar', 'image_fr', 'audio_ar', 'audio_fr'];

    private const IMAGES = 'jpg,jpeg,png,webp';

    private const AUDIO = 'mp3,wav,ogg,oga,m4a,aac';

    private const SORTABLE = ['created_at', 'time_limit_seconds'];

    public function index(Request $request): Response
    {
        return Inertia::render('Questions/Index', [
            'questions' => $this->query($request)
                ->paginate(10)
                ->withQueryString()
                ->through(fn (Question $question) => $this->summary($question)),
            'filters' => [
                'search' => (string) $request->query('search', ''),
                'category' => $this->categoryId($request),
                'answer' => $this->choice($request, 'answer', ['single', 'multiple']),
                'status' => $this->choice($request, 'status', ['active', 'inactive']),
                'media' => $this->choice($request, 'media', ['image', 'audio', 'none']),
                'format' => $this->choice($request, 'format', ['text_based', 'image_based']),
                'sort' => in_array($request->query('sort'), self::SORTABLE, true) ? $request->query('sort') : 'created_at',
                'direction' => $request->query('direction') === 'asc' ? 'asc' : 'desc',
            ],
            'stats' => [
                'total' => Question::count(),
                'active' => Question::where('is_active', true)->count(),
                'textBased' => Question::where('question_format', 'text_based')->count(),
                'imageBased' => Question::where('question_format', 'image_based')->count(),
                'withCategory' => Question::whereNotNull('license_category_id')->count(),
                'uncategorised' => Question::whereNull('license_category_id')->count(),
            ],
            'categories' => $this->categories(),
        ]);
    }

    public function chooseType(): Response
    {
        return Inertia::render('Questions/Create');
    }

    public function createText(): Response
    {
        return Inertia::render('Questions/Form', [
            'question' => null,
            'categories' => $this->categories(),
        ]);
    }

    public function createImage(): Response
    {
        return Inertia::render('Questions/ImageForm', [
            'question' => null,
            'categories' => $this->categories(),
        ]);
    }

    public function create(): Response
    {
        return $this->chooseType();
    }

    public function store(Request $request): RedirectResponse
    {
        $format = $request->input('question_format') === 'image_based' ? 'image_based' : 'text_based';

        if ($format === 'image_based') {
            return $this->storeImageBased($request);
        }

        $data = $this->mirrorTexts($request->validate($this->rules($request), $this->messages()));
        $choices = $this->choices($data['options']);
        $correct = $this->correctKeys($data['correct'], $choices);

        DB::transaction(function () use ($request, $data, $choices, $correct) {
            $question = new Question($this->attributes($data, count($correct), $request->user()->id));
            $this->applyMedia($request, $question);
            $question->save();

            $this->syncTexts($question, $data);
            $this->syncOptions($question, $choices, $correct);
        });

        return redirect()->route('questions.index')->with('success', 'created');
    }

    public function edit(Question $question): Response
    {
        $loaded = $question->loadMissing(['translations', 'options.translations']);
        $summary = $this->summary($loaded);

        $view = $question->question_format === 'image_based'
            ? 'Questions/ImageForm'
            : 'Questions/Form';

        return Inertia::render($view, [
            'question' => $summary,
            'categories' => $this->categories(),
        ]);
    }

    public function update(Request $request, Question $question): RedirectResponse
    {
        $format = $question->question_format;

        if ($format === 'image_based') {
            return $this->updateImageBased($request, $question);
        }

        $data = $this->mirrorTexts($request->validate($this->rules($request), $this->messages()));
        $choices = $this->choices($data['options']);
        $correct = $this->correctKeys($data['correct'], $choices);

        DB::transaction(function () use ($request, $question, $data, $choices, $correct) {
            $question->fill($this->attributes($data, count($correct)));
            $this->applyMedia($request, $question);
            $question->save();

            $this->syncTexts($question, $data);
            $this->syncOptions($question, $choices, $correct);
        });

        return redirect()->route('questions.index')->with('success', 'updated');
    }

    private function storeImageBased(Request $request): RedirectResponse
    {
        $data = $request->validate($this->imageBasedRules($request));
        $correct = $this->correctKeysFromIndexes($data['correct']);

        DB::transaction(function () use ($request, $data, $correct) {
            $question = new Question([
                'license_category_id' => ($data['license_category_id'] ?? null) ?: null,
                'time_limit_seconds' => $data['time_limit_seconds'],
                'question_type' => count($correct) > 1 ? 'multiple_choice' : 'single_choice',
                'question_format' => 'image_based',
                'explanation_ar' => ($data['explanation_ar'] ?? '') ?: null,
                'explanation_fr' => ($data['explanation_fr'] ?? '') ?: null,
                'created_by' => $request->user()->id,
            ]);
            $this->applyMedia($request, $question);
            $question->save();

            // Image-based questions store 4 option slots (A–D) with no text — only is_correct matters.
            foreach (self::KEYS as $position => $key) {
                $option = AnswerOption::updateOrCreate(
                    ['question_id' => $question->id, 'option_key' => $key],
                    ['is_correct' => in_array($key, $correct, true), 'sort_order' => $position + 1],
                );
                // No text translations needed for image-based choices.
                foreach (['ar', 'fr'] as $locale) {
                    OptionTranslation::updateOrCreate(
                        ['answer_option_id' => $option->id, 'locale' => $locale],
                        ['option_text' => (string) ($position + 1), 'prefix' => null],
                    );
                }
            }
        });

        return redirect()->route('questions.index')->with('success', 'created');
    }

    private function updateImageBased(Request $request, Question $question): RedirectResponse
    {
        $data = $request->validate($this->imageBasedRules($request));
        $correct = $this->correctKeysFromIndexes($data['correct']);

        DB::transaction(function () use ($request, $question, $data, $correct) {
            $question->fill([
                'license_category_id' => ($data['license_category_id'] ?? null) ?: null,
                'time_limit_seconds' => $data['time_limit_seconds'],
                'question_type' => count($correct) > 1 ? 'multiple_choice' : 'single_choice',
                'explanation_ar' => ($data['explanation_ar'] ?? '') ?: null,
                'explanation_fr' => ($data['explanation_fr'] ?? '') ?: null,
            ]);
            $this->applyMedia($request, $question);
            $question->save();

            foreach (self::KEYS as $position => $key) {
                $option = AnswerOption::updateOrCreate(
                    ['question_id' => $question->id, 'option_key' => $key],
                    ['is_correct' => in_array($key, $correct, true), 'sort_order' => $position + 1],
                );
                foreach (['ar', 'fr'] as $locale) {
                    OptionTranslation::updateOrCreate(
                        ['answer_option_id' => $option->id, 'locale' => $locale],
                        ['option_text' => (string) ($position + 1), 'prefix' => null],
                    );
                }
            }
        });

        return redirect()->route('questions.index')->with('success', 'updated');
    }

    private function imageBasedRules(Request $request): array
    {
        return [
            'license_category_id' => ['nullable', 'integer', Rule::exists(LicenseCategory::class, 'id')],
            'time_limit_seconds' => ['required', 'integer', 'min:1', 'max:600'],
            'explanation_ar' => ['nullable', 'string', 'max:2000'],
            'explanation_fr' => ['nullable', 'string', 'max:2000'],
            'correct' => ['required', 'array', 'min:1'],
            'correct.*' => ['integer', 'between:0,3', 'distinct'],
            'image_ar' => ['nullable', 'image', 'mimes:'.self::IMAGES, 'max:4096'],
            'image_fr' => ['nullable', 'image', 'mimes:'.self::IMAGES, 'max:4096'],
            'audio_ar' => ['nullable', 'file', 'mimes:'.self::AUDIO, 'max:16384'],
            'audio_fr' => ['nullable', 'file', 'mimes:'.self::AUDIO, 'max:16384'],
            'remove_image_ar' => ['boolean'],
            'remove_image_fr' => ['boolean'],
            'remove_audio_ar' => ['boolean'],
            'remove_audio_fr' => ['boolean'],
        ];
    }

    private function correctKeysFromIndexes(array $correct): array
    {
        return collect($correct)
            ->map(fn ($index) => (int) $index)
            ->filter(fn (int $index) => isset(self::KEYS[$index]))
            ->map(fn (int $index) => self::KEYS[$index])
            ->unique()
            ->values()
            ->all();
    }

    public function toggleActive(Question $question): RedirectResponse    {
        $wasActive = $question->is_active;
        $question->update(['is_active' => ! $wasActive]);

        return back()->with('success', $wasActive ? 'deactivated' : 'activated');
    }

    public function destroy(Question $question): RedirectResponse
    {
        try {
            $question->delete();
        } catch (QueryException) {
            return back()->withErrors(['questions' => 'This question is already part of an exam. Deactivate it instead.']);
        }

        foreach (self::MEDIA as $slot) {
            if ($question->{$slot} !== null) {
                Storage::disk('local')->delete($question->{$slot});
            }
        }

        return redirect()->route('questions.index')->with('success', 'deleted');
    }

    /**
     * Served instead of a public symlink so a recording or a picture only loads for a signed-in
     * administrator, and never by guessing an id in the URL.
     */
    public function media(Request $request, Question $question, string $slot)
    {
        abort_unless(in_array($slot, self::MEDIA, true), 404);

        $path = $question->{$slot};

        if ($path === null || ! Storage::disk('local')->exists($path)) {
            abort(404);
        }

        return response()->file(Storage::disk('local')->path($path));
    }

    private function query(Request $request)
    {
        $search = trim((string) $request->query('search', ''));
        $category = $this->categoryId($request);
        $answer = $this->choice($request, 'answer', ['single', 'multiple']);
        $status = $this->choice($request, 'status', ['active', 'inactive']);
        $media = $this->choice($request, 'media', ['image', 'audio', 'none']);
        $format = $this->choice($request, 'format', ['text_based', 'image_based']);

        return Question::query()
            ->with(['translations', 'options.translations', 'licenseCategory'])
            ->withCount('exams')
            ->when($search !== '', function ($query) use ($search) {
                $like = '%'.str_replace(['%', '_'], ['\%', '\_'], $search).'%';

                $query->whereHas('translations', fn ($inner) => $inner->where('question_text', 'like', $like));
            })
            ->when($category === 'none', fn ($query) => $query->whereNull('license_category_id'))
            ->when($category !== null && $category !== 'none', fn ($query) => $query->where('license_category_id', $category))
            ->when($answer, fn ($query) => $query->where('question_type', $answer === 'single' ? 'single_choice' : 'multiple_choice'))
            ->when($status, fn ($query) => $query->where('is_active', $status === 'active'))
            ->when($media === 'image', fn ($query) => $query->where(fn ($inner) => $inner->whereNotNull('image_ar')->orWhereNotNull('image_fr')))
            ->when($media === 'audio', fn ($query) => $query->where(fn ($inner) => $inner->whereNotNull('audio_ar')->orWhereNotNull('audio_fr')))
            ->when($media === 'none', fn ($query) => $query->whereNull('image_ar')->whereNull('image_fr')->whereNull('audio_ar')->whereNull('audio_fr'))
            ->when($format, fn ($query) => $query->where('question_format', $format))
            ->orderBy(...$this->order($request))
            ->orderByDesc('id');
    }

    private function order(Request $request): array
    {
        $sort = in_array($request->query('sort'), self::SORTABLE, true) ? $request->query('sort') : 'created_at';

        return [$sort, $request->query('direction') === 'asc' ? 'asc' : 'desc'];
    }

    /**
     * The bank is staff-facing and the strings land in a validation bag, so they stay in English
     * until the app grows server-side translations.
     */
    private function messages(): array
    {
        return [
            'question_fr.required' => 'Write the question in at least one language.',
            'question_ar.required' => 'Write the question in at least one language.',
        ];
    }

    private function rules(Request $request): array
    {
        // Writing both languages by hand is not the point of the bank: mirrorTexts() copies whichever
        // one was typed. requiredIf is used because it still runs on a value the form left out.
        $oneLanguage = fn (string $other) => Rule::requiredIf(
            fn () => trim((string) $request->input($other)) === ''
        );

        return [
            'question_fr' => [$oneLanguage('question_ar'), 'nullable', 'string', 'max:2000'],
            'question_ar' => [$oneLanguage('question_fr'), 'nullable', 'string', 'max:2000'],
            'license_category_id' => ['nullable', 'integer', Rule::exists(LicenseCategory::class, 'id')],
            'time_limit_seconds' => ['required', 'integer', 'min:1', 'max:600'],
            'explanation_ar' => ['nullable', 'string', 'max:2000'],
            'explanation_fr' => ['nullable', 'string', 'max:2000'],
            'options' => ['required', 'array', 'size:4', $this->choicesRule()],
            'options.*.fr' => ['nullable', 'string', 'max:1000'],
            'options.*.ar' => ['nullable', 'string', 'max:1000'],
            'options.*.prefix_fr' => ['nullable', 'string', 'max:60'],
            'options.*.prefix_ar' => ['nullable', 'string', 'max:60'],
            'correct' => ['required', 'array', 'min:1', $this->correctRule()],
            // The form ticks the choices by slot position, and A is slot zero.
            'correct.*' => ['integer', 'between:0,3', 'distinct'],
            'image_ar' => ['nullable', 'image', 'mimes:'.self::IMAGES, 'max:4096'],
            'image_fr' => ['nullable', 'image', 'mimes:'.self::IMAGES, 'max:4096'],
            'audio_ar' => ['nullable', 'file', 'mimes:'.self::AUDIO, 'max:16384'],
            'audio_fr' => ['nullable', 'file', 'mimes:'.self::AUDIO, 'max:16384'],
            'remove_image_ar' => ['boolean'],
            'remove_image_fr' => ['boolean'],
            'remove_audio_ar' => ['boolean'],
            'remove_audio_fr' => ['boolean'],
        ];
    }

    /**
     * Whatever the other language lacks is copied from the one that was typed, so an exam sat in
     * either of them never meets a blank question or a half-empty answer.
     */
    private function mirrorTexts(array $data): array
    {
        foreach (['question_fr', 'question_ar'] as $target) {
            $data[$target] = trim((string) ($data[$target] ?? ''));
        }

        foreach (['question_fr' => 'question_ar', 'question_ar' => 'question_fr'] as $target => $source) {
            if ($data[$target] === '' && $data[$source] !== '') {
                $data[$target] = $data[$source];
            }
        }

        // Mirror explanation the same way as question text.
        foreach (['explanation_fr', 'explanation_ar'] as $target) {
            $data[$target] = trim((string) ($data[$target] ?? ''));
        }
        foreach (['explanation_fr' => 'explanation_ar', 'explanation_ar' => 'explanation_fr'] as $target => $source) {
            if ($data[$target] === '' && isset($data[$source]) && $data[$source] !== '') {
                $data[$target] = $data[$source];
            }
        }

        foreach ($data['options'] as $index => $option) {
            foreach (['fr' => 'ar', 'ar' => 'fr', 'prefix_fr' => 'prefix_ar', 'prefix_ar' => 'prefix_fr'] as $target => $source) {
                $written = trim((string) ($option[$target] ?? ''));
                $other = trim((string) ($option[$source] ?? ''));

                if ($written === '' && $other !== '') {
                    $data['options'][$index][$target] = $option[$source];
                }
            }
        }

        return $data;
    }

    /**
     * Choices fill from the top: a question may have two, three or four of them, but never a gap.
     */
    private function choicesRule(): Closure
    {
        return function (string $attribute, mixed $value, Closure $fail) {
            $filled = [];

            foreach (array_values((array) $value) as $index => $option) {
                if (trim((string) ($option['fr'] ?? '')) === '' && trim((string) ($option['ar'] ?? '')) === '') {
                    continue;
                }

                $filled[] = $index;
            }

            if (count($filled) < 2) {
                $fail('A question needs at least two filled choices.');

                return;
            }

            if ($filled !== range(0, count($filled) - 1)) {
                $fail('Fill the choices from the first empty slot — a question cannot skip one.');
            }
        };
    }

    /**
     * A tick on an empty slot would store an answer to a choice nobody can see.
     */
    private function correctRule(): Closure
    {
        return function (string $attribute, mixed $value, Closure $fail, Validator $validator) {
            $options = (array) $validator->getValue('options');

            foreach ((array) $value as $index) {
                $option = $options[(int) $index] ?? null;

                if (trim((string) ($option['fr'] ?? '')) === '' && trim((string) ($option['ar'] ?? '')) === '') {
                    $fail('A correct answer has to be one of the filled choices.');

                    return;
                }
            }
        };
    }

    /**
     * Only the filled slots become rows, so a two-choice question stores two and not four.
     */
    private function choices(array $options): array
    {
        $choices = [];

        foreach (array_values($options) as $index => $option) {
            $fr = trim((string) ($option['fr'] ?? ''));
            $ar = trim((string) ($option['ar'] ?? ''));

            if ($fr === '' || $ar === '') {
                continue;
            }

            $choices[] = [
                'index' => $index,
                'key' => self::KEYS[$index],
                'fr' => $fr,
                'ar' => $ar,
                // The lead-in is optional; an empty one stores as null rather than an empty string.
                'prefixFr' => trim((string) ($option['prefix_fr'] ?? '')) ?: null,
                'prefixAr' => trim((string) ($option['prefix_ar'] ?? '')) ?: null,
            ];
        }

        return $choices;
    }

    private function correctKeys(array $correct, array $choices): array
    {
        $available = array_column($choices, 'index');

        return collect($correct)
            ->map(fn ($index) => (int) $index)
            ->filter(fn (int $index) => in_array($index, $available, true))
            ->map(fn (int $index) => self::KEYS[$index])
            ->unique()
            ->values()
            ->all();
    }

    private function attributes(array $data, int $correctCount, ?int $creatorId = null): array
    {
        $attributes = [
            'license_category_id' => ($data['license_category_id'] ?? null) ?: null,
            'time_limit_seconds' => $data['time_limit_seconds'],
            'question_format' => 'text_based',
            'explanation_ar' => ($data['explanation_ar'] ?? '') ?: null,
            'explanation_fr' => ($data['explanation_fr'] ?? '') ?: null,
            'question_type' => $correctCount > 1 ? 'multiple_choice' : 'single_choice',
        ];

        if ($creatorId !== null) {
            $attributes['created_by'] = $creatorId;
        }

        return $attributes;
    }

    private function syncTexts(Question $question, array $data): void
    {
        foreach (['ar' => $data['question_ar'], 'fr' => $data['question_fr']] as $locale => $text) {
            QuestionTranslation::updateOrCreate(
                ['question_id' => $question->id, 'locale' => $locale],
                ['question_text' => $text],
            );
        }
    }

    private function syncOptions(Question $question, array $choices, array $correct): void
    {
        // A slot emptied in the form is gone, not left behind as an unticked ghost answer. Clearing
        // it before the rest are written also frees the ordering a surviving choice moves up into.
        $stale = $question->options()
            ->whereNotIn('option_key', array_column($choices, 'key'))
            ->pluck('id');

        if ($stale->isNotEmpty()) {
            OptionTranslation::whereIn('answer_option_id', $stale)->delete();
            $question->options()->whereIn('id', $stale)->delete();
            $question->unsetRelation('options');
        }

        foreach ($choices as $position => $choice) {
            $option = AnswerOption::updateOrCreate(
                ['question_id' => $question->id, 'option_key' => $choice['key']],
                ['is_correct' => in_array($choice['key'], $correct, true), 'sort_order' => $position + 1],
            );

            foreach (
                [
                    'ar' => ['text' => $choice['ar'], 'prefix' => $choice['prefixAr']],
                    'fr' => ['text' => $choice['fr'], 'prefix' => $choice['prefixFr']],
                ] as $locale => $values
            ) {
                OptionTranslation::updateOrCreate(
                    ['answer_option_id' => $option->id, 'locale' => $locale],
                    ['option_text' => $values['text'], 'prefix' => $values['prefix']],
                );
            }
        }
    }

    private function applyMedia(Request $request, Question $question): void
    {
        foreach (self::MEDIA as $slot) {
            $file = $request->file($slot);

            if ($file instanceof UploadedFile) {
                $this->deleteMedia($question, $slot);
                $question->{$slot} = $file->store('questions', 'local');

                continue;
            }

            if ($request->boolean('remove_'.$slot)) {
                $this->deleteMedia($question, $slot);
            }
        }
    }

    private function deleteMedia(Question $question, string $slot): void
    {
        if ($question->{$slot} !== null) {
            Storage::disk('local')->delete($question->{$slot});
        }

        $question->{$slot} = null;
    }

    private function summary(Question $question): array
    {
        $options = $question->options->sortBy('sort_order');

        return [
            'id' => $question->id,
            'format' => $question->question_format ?? 'text_based',
            'textFr' => $question->textFor('fr'),
            'textAr' => $question->textFor('ar'),
            'explanationFr' => $question->explanation_fr,
            'explanationAr' => $question->explanation_ar,
            'categoryId' => $question->licenseCategory?->id,
            'categoryCode' => $question->licenseCategory?->code,
            'categoryFr' => $question->licenseCategory?->name_fr,
            'categoryAr' => $question->licenseCategory?->name_ar,
            'timeSeconds' => $question->time_limit_seconds,
            'multiple' => $question->question_type === 'multiple_choice',
            'choices' => $options->map(fn (AnswerOption $option) => [
                'key' => $option->option_key,
                'fr' => $option->textFor('fr'),
                'ar' => $option->textFor('ar'),
                'prefixFr' => $option->prefixFor('fr'),
                'prefixAr' => $option->prefixFor('ar'),
                'correct' => $option->is_correct,
            ])->values(),
            'correct' => $options->where('is_correct', true)->pluck('option_key')->values(),
            'media' => [
                'imageAr' => $this->mediaUrl($question, 'image_ar'),
                'imageFr' => $this->mediaUrl($question, 'image_fr'),
                'audioAr' => $this->mediaUrl($question, 'audio_ar'),
                'audioFr' => $this->mediaUrl($question, 'audio_fr'),
            ],
            'isActive' => $question->is_active,
            'examsCount' => (int) $question->exams_count,
            'createdAt' => $question->created_at?->toDateString(),
        ];
    }

    private function mediaUrl(Question $question, string $slot): ?string
    {
        return $question->{$slot} === null
            ? null
            : route('questions.media', [$question, $slot]).'?v='.$question->updated_at->timestamp;
    }

    private function categories(): array
    {
        return LicenseCategory::query()
            ->orderBy('code')
            ->get(['id', 'code', 'name_ar', 'name_fr'])
            ->map(fn (LicenseCategory $category) => [
                'id' => $category->id,
                'code' => $category->code,
                'nameAr' => $category->name_ar,
                'nameFr' => $category->name_fr,
            ])
            ->all();
    }

    private function categoryId(Request $request): ?string
    {
        $value = $request->query('category');

        if ($value === 'none') {
            return 'none';
        }

        return $value !== null && ctype_digit((string) $value) ? (string) $value : null;
    }

    private function choice(Request $request, string $key, array $allowed): ?string
    {
        $value = $request->query($key);

        return in_array($value, $allowed, true) ? $value : null;
    }
}
