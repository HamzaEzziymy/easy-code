<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\LicenseCategory;
use App\Models\Student;
use App\Models\User;
use Illuminate\Database\QueryException;
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

    private const PROFILE_FIELDS = [
        'student_number',
        'license_category_id',
        'phone',
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
        $data = $request->validate($this->rules($request));

        if ($this->codeRequested($request) && $this->codeTaken($request)) {
            return $this->codeTakenBack();
        }

        $student = DB::transaction(function () use ($request, $data) {
            $account = User::create([
                'name' => $data['name'],
                'email' => $data['email'] ?? null,
                'password' => null,
                'role' => 'student',
                'login_code_hash' => $this->codeHash($request),
                'is_active' => true,
            ]);

            $profile = new Student(Arr::only($data, self::PROFILE_FIELDS));
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
                'id' => $student->id,
                'userId' => $student->user_id,
                'name' => $student->user?->name,
                'email' => $student->user?->email,
                'isActive' => (bool) $student->user?->is_active,
                'hasLoginCode' => $student->user?->login_code_hash !== null,
                'lastLoginAt' => $student->user?->last_login_at?->toIso8601String(),
                'createdAt' => $student->created_at?->toIso8601String(),
                'studentNumber' => $student->student_number,
                'phone' => $student->phone,
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
        return Inertia::render('Students/Form', [
            'student' => [
                'id' => $student->id,
                'userId' => $student->user_id,
                'name' => $student->user?->name,
                'email' => $student->user?->email,
                'studentNumber' => $student->student_number,
                'licenseCategoryId' => $student->license_category_id,
                'phone' => $student->phone,
                'cin' => $student->cin,
                'birthDate' => $student->birth_date?->toDateString(),
                'birthplace' => $student->birthplace,
                'gender' => $student->gender,
                'enrollmentDate' => $student->enrollment_date?->toDateString(),
                'status' => $student->status,
                'notes' => $student->notes,
                'photoUrl' => $this->photoUrl($student),
            ],
            'categories' => $this->categories(),
            'suggestedNumber' => null,
        ]);
    }

    public function update(Request $request, Student $student): RedirectResponse
    {
        $data = $request->validate($this->rules($request, $student));

        if ($this->codeRequested($request) && $this->codeTaken($request, $student->user_id)) {
            return $this->codeTakenBack();
        }

        DB::transaction(function () use ($request, $student, $data) {
            if ($account = $student->user) {
                $account->fill([
                    'name' => $data['name'],
                    'email' => $data['email'] ?? null,
                ]);

                if ($this->codeRequested($request)) {
                    $account->login_code_hash = $this->codeHash($request);
                }

                $account->save();
            }

            $student->fill(Arr::only($data, self::PROFILE_FIELDS));
            $this->applyPhoto($request, $student);
            $student->save();
        });

        return redirect()->route('students.show', $student)->with('success', 'updated');
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
        try {
            DB::transaction(function () use ($student) {
                $user = $student->user;
                $photo = $student->photo_path;

                $student->delete();
                $user?->delete();

                if ($photo) {
                    Storage::disk('local')->delete($photo);
                }
            });
        } catch (QueryException) {
            return back()->withErrors(['students' => 'This file still has exam or appointment records. Suspend it instead.']);
        }

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
            ->with(['user:id,name,is_active,last_login_at,login_code_hash', 'licenseCategory:id,code,name_fr,name_ar'])
            ->when($search !== '', function ($query) use ($search) {
                $like = '%'.str_replace(['%', '_'], ['\%', '\_'], $search).'%';

                $query->where(function ($inner) use ($like) {
                    $inner->where('student_number', 'like', $like)
                        ->orWhere('cin', 'like', $like)
                        ->orWhere('phone', 'like', $like)
                        ->orWhereHas('user', fn ($user) => $user->where('name', 'like', $like));
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
            'name' => $student->user?->name,
            'studentNumber' => $student->student_number,
            'phone' => $student->phone,
            'cin' => $student->cin,
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
        ];
    }

    private function rules(Request $request, ?Student $student = null): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'nullable', 'string', 'lowercase', 'email', 'max:255',
                Rule::unique(User::class, 'email')->ignore($student?->user_id),
            ],
            'login_code' => [
                $student === null ? 'required' : 'nullable',
                'string', 'min:4', 'max:32',
            ],
            'student_number' => [
                'required', 'string', 'max:30',
                Rule::unique('students', 'student_number')->ignore($student?->id),
            ],
            'license_category_id' => ['required', 'integer', Rule::exists('license_categories', 'id')],
            'enrollment_date' => ['required', 'date'],
            'status' => ['required', Rule::in(self::STATUSES)],
            'phone' => ['nullable', 'string', 'max:30'],
            'cin' => ['nullable', 'string', 'max:20'],
            'birth_date' => ['nullable', 'date'],
            'birthplace' => ['nullable', 'string', 'max:120'],
            'gender' => ['nullable', Rule::in(self::GENDERS)],
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

    private function categories(): array
    {
        return LicenseCategory::query()
            ->where('is_active', true)
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
