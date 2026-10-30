<?php

use App\Http\Controllers\Admin\CategoryController;
use App\Http\Controllers\Admin\CourseController;
use App\Http\Controllers\Admin\QuestionController;
use App\Http\Controllers\Admin\StudentController;
use App\Http\Controllers\Admin\TestController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Student\DashboardController as StudentDashboard;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified', 'role:admin'])->name('dashboard');

Route::get('/student', StudentDashboard::class)
    ->middleware(['auth', 'role:student'])
    ->name('student.dashboard');

Route::get('/students/{student}/photo', [StudentController::class, 'photo'])
    ->middleware('auth')
    ->name('students.photo');

Route::middleware(['auth', 'role:admin'])->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('/users', [UserController::class, 'index'])->name('users.index');
    Route::post('/users', [UserController::class, 'store'])->name('users.store');
    Route::patch('/users/{user}', [UserController::class, 'update'])->name('users.update');
    Route::patch('/users/{user}/active', [UserController::class, 'toggleActive'])->name('users.toggleActive');
    Route::delete('/users/{user}', [UserController::class, 'destroy'])->name('users.destroy');

    Route::get('/students', [StudentController::class, 'index'])->name('students.index');
    Route::get('/students/create', [StudentController::class, 'create'])->name('students.create');
    Route::post('/students', [StudentController::class, 'store'])->name('students.store');
    Route::get('/students/{student}', [StudentController::class, 'show'])->name('students.show');
    Route::get('/students/{student}/edit', [StudentController::class, 'edit'])->name('students.edit');
    Route::patch('/students/{student}', [StudentController::class, 'update'])->name('students.update');
    Route::patch('/students/{student}/active', [StudentController::class, 'toggleActive'])->name('students.toggleActive');
    Route::patch('/students/{student}/lessons', [StudentController::class, 'lessons'])->name('students.lessons');
    Route::delete('/students/{student}', [StudentController::class, 'destroy'])->name('students.destroy');

    Route::get('/categories', [CategoryController::class, 'index'])->name('categories.index');
    Route::get('/categories/{category}/icon', [CategoryController::class, 'icon'])->name('categories.icon');
    Route::post('/categories', [CategoryController::class, 'store'])->name('categories.store');
    Route::patch('/categories/{category}', [CategoryController::class, 'update'])->name('categories.update');
    Route::patch('/categories/{category}/active', [CategoryController::class, 'toggleActive'])->name('categories.toggleActive');
    Route::delete('/categories/{category}', [CategoryController::class, 'destroy'])->name('categories.destroy');

    Route::get('/exams/{category}', function (\App\Models\LicenseCategory $category) {
        $presentCourse = fn (\App\Models\Course $c) => [
            'id'            => $c->id,
            'nameFr'        => $c->name_fr,
            'nameAr'        => $c->name_ar,
            'descriptionFr' => $c->description_fr,
            'descriptionAr' => $c->description_ar,
            'status'        => $c->status,
            'categoryId'    => $c->license_category_id,
            'coverUrl'      => $c->cover_path ? route('courses.file', [$c, 'cover']).'?v='.$c->updated_at->timestamp : null,
            'pdfFrUrl'      => $c->pdf_fr_path ? route('courses.file', [$c, 'pdf_fr']).'?v='.$c->updated_at->timestamp : null,
            'pdfArUrl'      => $c->pdf_ar_path ? route('courses.file', [$c, 'pdf_ar']).'?v='.$c->updated_at->timestamp : null,
        ];

        $presentTest = fn (\App\Models\Test $t) => [
            'id'             => $t->id,
            'nameFr'         => $t->name_fr,
            'nameAr'         => $t->name_ar,
            'descriptionFr'  => $t->description_fr,
            'descriptionAr'  => $t->description_ar,
            'status'         => $t->status,
            'categoryId'     => $t->license_category_id,
            'duration'       => $t->duration_minutes,
            'passPercentage' => $t->pass_percentage,
            'questionsCount' => $t->testQuestions()->count(),
            'questionIds'    => $t->testQuestions()->pluck('question_id')->values()->all(),
            'coverUrl'       => $t->cover_path ? route('tests.file', [$t, 'cover']).'?v='.$t->updated_at->timestamp : null,
        ];

        $presentExam = fn (\App\Models\Exam $e) => [
            'id'             => $e->id,
            'nameFr'         => $e->title_fr,
            'nameAr'         => $e->title_ar,
            'descriptionFr'  => $e->description,
            'descriptionAr'  => $e->description,
            'status'         => $e->status,
            'duration'       => $e->duration_minutes,
            'questionsCount' => $e->examQuestions()->count(),
            'coverUrl'       => null,
        ];

        return \Inertia\Inertia::render('Exams/CategoryDashboard', [
            'category' => [
                'id'     => $category->id,
                'code'   => $category->code,
                'nameFr' => $category->name_fr,
                'nameAr' => $category->name_ar,
            ],
            'courses' => \App\Models\Course::where('license_category_id', $category->id)
                ->latest()->get()->map($presentCourse)->values(),
            'tests'   => \App\Models\Test::where('license_category_id', $category->id)
                ->latest()->get()->map($presentTest)->values(),
            'exams'   => \App\Models\Exam::where('license_category_id', $category->id)
                ->latest()->get()->map($presentExam)->values(),
            'categories' => \App\Models\LicenseCategory::orderBy('code')
                ->get(['id', 'code', 'name_ar', 'name_fr'])
                ->map(fn ($c) => [
                    'id'     => $c->id,
                    'code'   => $c->code,
                    'nameAr' => $c->name_ar,
                    'nameFr' => $c->name_fr,
                ]),
            'questions' => \App\Models\Question::where('is_active', true)
                ->with(['translations', 'licenseCategory'])
                ->get()
                ->map(fn ($q) => [
                    'id'           => $q->id,
                    'textFr'       => $q->textFor('fr'),
                    'textAr'       => $q->textFor('ar'),
                    'categoryId'   => $q->license_category_id,
                    'categoryCode' => $q->licenseCategory?->code,
                ])
                ->all(),
        ]);
    })->name('exams.category');

    Route::get('/questions', [QuestionController::class, 'index'])->name('questions.index');
    Route::get('/questions/create', [QuestionController::class, 'chooseType'])->name('questions.create');
    Route::get('/questions/create/text', [QuestionController::class, 'createText'])->name('questions.create.text');
    Route::get('/questions/create/image', [QuestionController::class, 'createImage'])->name('questions.create.image');
    Route::post('/questions', [QuestionController::class, 'store'])->name('questions.store');
    Route::get('/questions/{question}/edit', [QuestionController::class, 'edit'])->name('questions.edit');
    Route::patch('/questions/{question}', [QuestionController::class, 'update'])->name('questions.update');
    Route::patch('/questions/{question}/active', [QuestionController::class, 'toggleActive'])->name('questions.toggleActive');
    Route::delete('/questions/{question}', [QuestionController::class, 'destroy'])->name('questions.destroy');
    Route::get('/questions/{question}/media/{slot}', [QuestionController::class, 'media'])->name('questions.media');

    // Courses
    Route::get('/courses/{course}/file/{slot}', [CourseController::class, 'file'])->name('courses.file');
    Route::post('/courses', [CourseController::class, 'store'])->name('courses.store');
    Route::patch('/courses/{course}', [CourseController::class, 'update'])->name('courses.update');
    Route::delete('/courses/{course}', [CourseController::class, 'destroy'])->name('courses.destroy');

    // Tests
    Route::get('/tests/{test}/file/{slot}', [TestController::class, 'file'])->name('tests.file');
    Route::post('/tests', [TestController::class, 'store'])->name('tests.store');
    Route::patch('/tests/{test}', [TestController::class, 'update'])->name('tests.update');
    Route::delete('/tests/{test}', [TestController::class, 'destroy'])->name('tests.destroy');
});

require __DIR__.'/auth.php';
