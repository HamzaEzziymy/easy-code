<?php

use App\Http\Controllers\Admin\CategoryController;
use App\Http\Controllers\Admin\QuestionController;
use App\Http\Controllers\Admin\StudentController;
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
        return \Inertia\Inertia::render('Exams/CategoryDashboard', [
            'category' => [
                'id'     => $category->id,
                'code'   => $category->code,
                'nameFr' => $category->name_fr,
                'nameAr' => $category->name_ar,
            ],
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
});

require __DIR__.'/auth.php';
