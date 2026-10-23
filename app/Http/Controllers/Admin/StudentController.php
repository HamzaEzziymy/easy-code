<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AttemptAnswer;
use App\Models\AttemptAnswerOption;
use App\Models\LicenseCategory;
use App\Models\Student;
use App\Models\User;
use App\Support\Digits;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class StudentController extends Controller
{
    private const SORTABLE = ['student_number', 'enrollment_date', 'created_at', 'status'];

    private const STATUSES = ['active', 'completed', 'suspended'];

    private const GENDERS = ['male', 'female'];

    /**
     * The two languages a theory exam exists in — every exam and question carries a French and an
     * Arabic text — so a trainee's file names the one they sit it in.
     */
    private const EXAM_LANGUAGES = ['ar', 'fr'];

    /**
     * Squares a file's bar gets, so sessions it accepts, when staff never entered a number.
     */
    private const DEFAULT_SEANCES = 30;

    private const PROFILE_FIELDS = [
        'student_number',
        'license_category_id',
        'exam_language',
        'first_name',
        'last_name',
        'first_name_ar',
        'last_name_ar',
        'phone',
        'lessons_total',
        'cin',
        'birth_date',
        'birthplace',
        'gender',
        'enrollment_date',
        'status',
        'notes',
    ];

    public function index(Request $request): Response
    {
        return Inertia::render('Students/Index', [
            'students' => $this->query($request)
                ->paginate(10)
                ->withQueryString()
                ->through(fn (Student $student) => $this->summary($student)),
            'filters' => [
                'search' => (string) $request->query('search', ''),
                'status' => $this->choice($request, 'status', self::STATUSES),
                'category' => $this->categoryId($request),
                'access' => $this->choice($request, 'access', ['active', 'inactive']),
                'sort' => in_array($request->query('sort'), self::SORTABLE, true) ? $request->query('sort') : 'enrollment_date',
                'direction' => $request->query('direction') === 'asc' ? 'asc' : 'desc',
            ],
            'stats' => [
                'total' => Student::count(),
                'active' => Student::where('status', 'active')->count(),
                'completed' => Student::where('status', 'completed')->count(),
                'suspended' => Student::where('status', 'suspended')->count(),
            ],
            'categories' => $this->categories(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Students/Form', [
            'student' => null,
            'categories' => $this->categories(),
            'suggestedNumber' => $this->nextStudentNumber(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->foldSquares($request);

        $data = $request->validate($this->rules($request));

        if ($this->codeRequested($request) && $this->codeTaken($request)) {
            return $this->codeTakenBack();
        }

        $student = DB::transaction(function () use ($request, $data) {
            $profile = new Student(Arr::only($data, self::PROFILE_FIELDS));

            $account = User::create([
                'name' => $profile->displayName(),
                'email' => $data['email'] ?? null,
                'password' => null,
                'role' => 'student',
                'login_code_hash' => $this->codeHash($request),
                'login_code' => $this->plainCode($request),
                'is_active' => true,
            ]);

            $profile->user_id = $account->id;
            $profile->photo_path = $this->storePhoto($request);
            $profile->save();

            return $profile;
        });

        return redirect()->route('students.show', $student)->with('success', 'created');
    }

    public function show(Student $student): Response
    {
        $student->load([
            'user',
            'licenseCategory',
            'appointments.exam',
            'successRecords.licenseCategory',
            'examAttempts.exam',
        ]);

        $graded = $student->examAttempts->filter(fn ($attempt) => $attempt->percentage !== null);

        return Inertia::render('Students/Show', [
            'student' => [
                ...$this->card($student),
                'lastLoginAt' => $student->user?->last_login_at?->toIso8601String(),
                'createdAt' => $student->created_at?->toIso8601String(),
                'attempts' => [
                    'count' => $student->examAttempts->count(),
                    'average' => $graded->count() > 0 ? round($graded->avg('percentage'), 1) : null,
                    'passed' => $student->examAttempts->where('is_passed', true)->count(),
                ],
                'appointments' => $student->appointments->map(fn ($appointment) => [
                    'id' => $appointment->id,
                    'type' => $appointment->appointment_type,
                    'status' => $appointment->status,
                    'scheduledAt' => $appointment->scheduled_at?->toIso8601String(),
                    'examTitleFr' => $appointment->exam?->title_fr,
                    'examTitleAr' => $appointment->exam?->title_ar,
                    'notes' => $appointment->notes,
                ])->values(),
                'successRecords' => $student->successRecords->map(fn ($record) => [
                    'id' => $record->id,
                    'type' => $record->success_type,
                    'achievedAt' => $record->achieved_at?->toIso8601String(),
                    'categoryCode' => $record->licenseCategory?->code,
                    'notes' => $record->notes,
                ])->values(),
            ],
        ]);
    }

    public function edit(Student $student): Response
    {
        $student->load('user');

        return Inertia::render('Students/Form', [
            'student' => $this->card($student),
            'categories' => $this->categories($student->license_category_id),
            'suggestedNumber' => null,
        ]);
    }

    /**
     * Shared by the file page and the edit form so both read the same picture of a trainee.
     */
    private function card(Student $student): array
    {
        return [
            'id' => $student->id,
            'userId' => $student->user_id,
            'name' => $student->displayName(),
            'firstName' => $student->first_name,
            'lastName' => $student->last_name,
            'firstNameAr' => $student->first_name_ar,
            'lastNameAr' => $student->last_name_ar,
            'email' => $student->user?->email,
            'loginCode' => $student->user?->login_code,
            'isActive' => (bool) $student->user?->is_active,
            'studentNumber' => $student->student_number,
            'licenseCategoryId' => $student->license_category_id,
            'examLanguage' => $student->exam_language,
            'phone' => $student->phone,
            'lessonsCount' => $student->lessons_count,
            'lessonsTotal' => $student->lessons_total,
            'cin' => $student->cin,
            'birthDate' => $student->birth_date?->toDateString(),
            'birthplace' => $student->birthplace,
            'gender' => $student->gender,
            'enrollmentDate' => $student->enrollment_date?->toDateString(),
            'status' => $student->status,
            'notes' => $student->notes,
            'photoUrl' => $this->photoUrl($student),
            'category' => $student->licenseCategory ? [
                'id' => $student->licenseCategory->id,
                'code' => $student->licenseCategory->code,
                'nameFr' => $student->licenseCategory->name_fr,
                'nameAr' => $student->licenseCategory->name_ar,
            ] : null,
        ];
    }

    public function update(Request $request, Student $student): RedirectResponse
    {
        $this->foldSquares($request);

        $data = $request->validate($this->rules($request, $student));

        if ($this->codeRequested($request) && $this->codeTaken($request, $student->user_id)) {
            return $this->codeTakenBack();
        }

        DB::transaction(function () use ($request, $student, $data) {
            $student->fill(Arr::only($data, self::PROFILE_FIELDS));

            // Shrinking the bar below the sessions already recorded would leave counts
            // the file page can no longer show, so they fall back to the new maximum.
            if ($student->lessons_total !== null && $student->lessons_count > $student->lessons_total) {
                $student->lessons_count = $student->lessons_total;
            }

            if ($account = $student->user) {
                $account->fill([
                    'name' => $student->displayName(),
                    'email' => $data['email'] ?? null,
                ]);

                if ($this->codeRequested($request)) {
                    $account->login_code_hash = $this->codeHash($request);
                    $account->login_code = $this->plainCode($request);
                }

                $account->save();
            }

            $this->applyPhoto($request, $student);
            $student->save();
        });

        return redirect()->route('students.show', $student)->with('success', 'updated');
    }

    /**
     * The file page's séance bar clicks this instead of going through the edit form, so a
     * completed lesson can be recorded without reopening the whole file.
     */
    public function lessons(Request $request, Student $student): RedirectResponse
    {
        $maximum = $student->lessons_total ?? self::DEFAULT_SEANCES;

        $data = $request->validate([
            'lessons_count' => ['required', 'integer', "between:0,{$maximum}"],
        ]);

        $student->update(['lessons_count' => $data['lessons_count']]);

        return back();
    }

    /**
     * Squares take whatever the keyboard sends, and an Arabic keyboard sends ١٢.
     */
    private function foldSquares(Request $request): void
    {
        $value = Digits::latin(trim((string) $request->input('lessons_total', '')));

        $request->merge(['lessons_total' => $value === '' ? null : $value]);
    }

    public function toggleActive(Request $request, Student $student): RedirectResponse
    {
        $user = $student->user;

        if ($user === null || $user->is($request->user())) {
            return back()->withErrors(['status' => 'You cannot deactivate the account you are signed in with.']);
        }

        $wasActive = (bool) $user->is_active;
        $user->update(['is_active' => ! $wasActive]);

        return back()->with('success', $wasActive ? 'deactivated' : 'activated');
    }

    public function destroy(Student $student): RedirectResponse
    {
        DB::transaction(function () use ($student): void {
            $user = $student->user;
            $photo = $student->photo_path;

            // Every table pointing at this file restricts on delete, so the history goes first.
            $attemptIds = $student->examAttempts()->pluck('id');
            $answerIds = AttemptAnswer::query()->whereIn('attempt_id', $attemptIds)->pluck('id');

            AttemptAnswerOption::query()->whereIn('attempt_answer_id', $answerIds)->delete();
            AttemptAnswer::query()->whereIn('attempt_id', $attemptIds)->delete();
            $student->appointments()->delete();
            $student->successRecords()->delete();
            $student->examAttempts()->delete();

            $student->delete();
            $user?->delete();

            if ($photo) {
                Storage::disk('local')->delete($photo);
            }
        });

        return redirect()->route('students.index')->with('success', 'deleted');
    }

    /**
     * Served instead of a public symlink so the photo stays behind the auth guard.
     */
    public function photo(Request $request, Student $student)
    {
        if (! $request->user()->isAdmin() && $request->user()->id !== $student->user_id) {
            abort(403);
        }

        if ($student->photo_path === null || ! Storage::disk('local')->exists($student->photo_path)) {
            abort(404);
        }

        return response()->file(Storage::disk('local')->path($student->photo_path));
    }

    private function query(Request $request)
    {
        $sort = in_array($request->query('sort'), self::SORTABLE, true) ? $request->query('sort') : 'enrollment_date';
        $direction = $request->query('direction') === 'asc' ? 'asc' : 'desc';
        $search = trim((string) $request->query('search', ''));
        $status = $this->choice($request, 'status', self::STATUSES);
        $category = $this->categoryId($request);
        $access = $this->choice($request, 'access', ['active', 'inactive']);

        return Student::query()
            ->with(['user:id,name,is_active,last_login_at,login_code_hash,login_code,email', 'licenseCategory:id,code,name_fr,name_ar'])
            ->withCount(['examAttempts', 'appointments', 'successRecords'])
            ->when($search !== '', function ($query) use ($search) {
                $like = '%'.str_replace(['%', '_'], ['\%', '\_'], $search).'%';

                $query->where(function ($inner) use ($like) {
                    $inner->where('student_number', 'like', $like)
                        ->orWhere('cin', 'like', $like)
                        ->orWhere('phone', 'like', $like)
                        ->orWhere('first_name', 'like', $like)
                        ->orWhere('last_name', 'like', $like)
                        ->orWhere('first_name_ar', 'like', $like)
                        ->orWhere('last_name_ar', 'like', $like)
                        ->orWhereHas('user', fn ($user) => $user
                            ->where('name', 'like', $like)
                            ->orWhere('login_code', 'like', $like));
                });
            })
            ->when($status, fn ($query) => $query->where('status', $status))
            ->when($category, fn ($query) => $query->where('license_category_id', $category))
            ->when($access, fn ($query) => $query->whereHas(
                'user',
                fn ($user) => $user->where('is_active', $access === 'active')
            ))
            ->orderBy($sort, $direction)
            ->orderBy('id');
    }

    private function summary(Student $student): array
    {
        return [
            'id' => $student->id,
            'userId' => $student->user_id,
            'name' => $student->displayName(),
            'firstName' => $student->first_name,
            'lastName' => $student->last_name,
            'firstNameAr' => $student->first_name_ar,
            'lastNameAr' => $student->last_name_ar,
            'loginCode' => $student->user?->login_code,
            'studentNumber' => $student->student_number,
            'examLanguage' => $student->exam_language,
            'phone' => $student->phone,
            'email' => $student->user?->email,
            'photoUrl' => $this->photoUrl($student),
            'enrollmentDate' => $student->enrollment_date?->toDateString(),
            'status' => $student->status,
            'isActive' => (bool) $student->user?->is_active,
            'lastLoginAt' => $student->user?->last_login_at?->toIso8601String(),
            'createdAt' => $student->created_at?->toDateString(),
            'category' => $student->licenseCategory ? [
                'id' => $student->licenseCategory->id,
                'code' => $student->licenseCategory->code,
                'nameFr' => $student->licenseCategory->name_fr,
                'nameAr' => $student->licenseCategory->name_ar,
            ] : null,
            'history' => [
                'attempts' => (int) $student->exam_attempts_count,
                'appointments' => (int) $student->appointments_count,
                'records' => (int) $student->success_records_count,
            ],
        ];
    }

    private function rules(Request $request, ?Student $student = null): array
    {
        return [
            'first_name' => ['required', 'string', 'max:120'],
            'last_name' => ['required', 'string', 'max:120'],
            'first_name_ar' => ['nullable', 'string', 'max:120'],
            'last_name_ar' => ['nullable', 'string', 'max:120'],
            'email' => [
                'nullable', 'string', 'lowercase', 'email', 'max:255',
                Rule::unique(User::class, 'email')->ignore($student?->user_id),
            ],
            'login_code' => [
                $student === null ? 'required' : 'nullable',
                'string', 'min:3', 'max:32',
            ],
            'student_number' => [
                'required', 'string', 'max:30',
                Rule::unique('students', 'student_number')->ignore($student?->id),
            ],
            'license_category_id' => ['required', 'integer', Rule::exists('license_categories', 'id')],
            'exam_language' => ['nullable', Rule::in(self::EXAM_LANGUAGES)],
            'enrollment_date' => ['required', 'date'],
            'status' => ['required', Rule::in(self::STATUSES)],
            'phone' => ['nullable', 'string', 'max:30'],
            'lessons_total' => ['nullable', 'integer', 'between:1,99'],
            'cin' => ['required', 'string', 'max:20'],
            'birth_date' => ['nullable', 'date'],
            'birthplace' => ['nullable', 'string', 'max:120'],
            'gender' => ['required', Rule::in(self::GENDERS)],
            'notes' => ['nullable', 'string', 'max:2000'],
            'photo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'remove_photo' => ['boolean'],
        ];
    }

    private function codeRequested(Request $request): bool
    {
        return trim((string) $request->input('login_code', '')) !== '';
    }

    private function codeHash(Request $request): ?string
    {
        return $this->codeRequested($request)
            ? User::hashLoginCode((string) $request->input('login_code'))
            : null;
    }

    /**
     * Stored exactly as the hash helper normalises it, so what staff read back is what
     * the trainee has to type.
     */
    private function plainCode(Request $request): ?string
    {
        return $this->codeRequested($request)
            ? User::normalizeLoginCode((string) $request->input('login_code'))
            : null;
    }

    private function codeTaken(Request $request, ?int $ignoreUserId = null): bool
    {
        $query = User::where('login_code_hash', $this->codeHash($request));

        return $ignoreUserId === null ? $query->exists() : $query->whereKeyNot($ignoreUserId)->exists();
    }

    private function codeTakenBack(): RedirectResponse
    {
        return back()
            ->withErrors(['login_code' => 'That login code is already assigned to another account.'])
            ->withInput();
    }

    private function storePhoto(Request $request): ?string
    {
        $file = $request->file('photo');

        return $file instanceof UploadedFile ? $file->store('students', 'local') : null;
    }

    private function applyPhoto(Request $request, Student $student): void
    {
        if ($request->boolean('remove_photo')) {
            $this->deletePhoto($student);

            return;
        }

        $path = $this->storePhoto($request);

        if ($path !== null) {
            $this->deletePhoto($student);
            $student->photo_path = $path;
        }
    }

    private function deletePhoto(Student $student): void
    {
        if ($student->photo_path !== null) {
            Storage::disk('local')->delete($student->photo_path);
        }

        $student->photo_path = null;
    }

    private function photoUrl(Student $student): ?string
    {
        return $student->photo_path === null ? null : route('students.photo', $student);
    }

    /**
     * A file keeps its category even when the category is switched off afterwards, so the
     * edit form has to offer it too or saving would silently move the trainee elsewhere.
     */
    private function categories(?int $alsoId = null): array
    {
        return LicenseCategory::query()
            ->where(fn ($query) => $query
                ->where('is_active', true)
                ->when($alsoId, fn ($query, $id) => $query->orWhere('id', $id)))
            ->orderBy('code')
            ->get(['id', 'code', 'name_fr', 'name_ar'])
            ->map(fn (LicenseCategory $category) => [
                'id' => $category->id,
                'code' => $category->code,
                'nameFr' => $category->name_fr,
                'nameAr' => $category->name_ar,
            ])
            ->all();
    }

    private function nextStudentNumber(): string
    {
        $prefix = 'EC-'.now()->format('Y').'-';
        $last = Student::where('student_number', 'like', $prefix.'%')->max('student_number');
        $sequence = $last === null ? 1 : ((int) substr($last, strlen($prefix))) + 1;

        return $prefix.str_pad((string) $sequence, 4, '0', STR_PAD_LEFT);
    }

    private function categoryId(Request $request): ?int
    {
        $category = $request->query('category');

        if ($category === null || $category === '') {
            return null;
        }

        return LicenseCategory::whereKey($category)->exists() ? (int) $category : null;
    }

    private function choice(Request $request, string $key, array $allowed): ?string
    {
        $value = $request->query($key);

        return in_array($value, $allowed, true) ? $value : null;
    }
}
