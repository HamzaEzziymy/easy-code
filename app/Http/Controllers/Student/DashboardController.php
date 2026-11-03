<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Exam;
use App\Models\StudentPdfProgress;
use App\Models\Test;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $student = $request->user()->studentProfile()->with('licenseCategory')->first();

        if (! $student) {
            return Inertia::render('Student/Dashboard', [
                'student'      => null,
                'courses'      => [],
                'tests'        => [],
                'exams'        => [],
                'pdfProgress'  => [],
            ]);
        }

        $catId = $student->license_category_id;

        // Courses for the student's category (published only)
        $courses = Course::where('license_category_id', $catId)
            ->where('status', 'published')
            ->latest()
            ->get()
            ->map(fn (Course $c) => [
                'id'            => $c->id,
                'nameFr'        => $c->name_fr,
                'nameAr'        => $c->name_ar,
                'descriptionFr' => $c->description_fr,
                'descriptionAr' => $c->description_ar,
                'status'        => $c->status,
                'coverUrl'      => $c->cover_path ? route('courses.file', [$c, 'cover']).'?v='.$c->updated_at->timestamp : null,
                'pdfFrUrl'      => $c->pdf_fr_path ? route('courses.file', [$c, 'pdf_fr']).'?v='.$c->updated_at->timestamp : null,
                'pdfArUrl'      => $c->pdf_ar_path ? route('courses.file', [$c, 'pdf_ar']).'?v='.$c->updated_at->timestamp : null,
            ])
            ->values();

        // Tests for the student's category (published only)
        $tests = Test::where('license_category_id', $catId)
            ->where('status', 'published')
            ->latest()
            ->get()
            ->map(fn (Test $t) => [
                'id'             => $t->id,
                'nameFr'         => $t->name_fr,
                'nameAr'         => $t->name_ar,
                'descriptionFr'  => $t->description_fr,
                'descriptionAr'  => $t->description_ar,
                'status'         => $t->status,
                'duration'       => $t->duration_minutes,
                'passPercentage' => $t->pass_percentage,
                'questionsCount' => $t->testQuestions()->count(),
                'coverUrl'       => $t->cover_path ? route('tests.file', [$t, 'cover']).'?v='.$t->updated_at->timestamp : null,
            ])
            ->values();

        // Exams for the student's category (published only)
        $exams = Exam::where('license_category_id', $catId)
            ->where('status', 'published')
            ->latest()
            ->get()
            ->map(fn (Exam $e) => [
                'id'             => $e->id,
                'nameFr'         => $e->title_fr,
                'nameAr'         => $e->title_ar,
                'descriptionFr'  => $e->description,
                'descriptionAr'  => $e->description_ar,
                'status'         => $e->status,
                'duration'       => $e->duration_minutes,
                'passPercentage' => $e->pass_percentage,
                'questionsCount' => $e->examQuestions()->count(),
                'coverUrl'       => $e->cover_path ? route('exams.file', [$e, 'cover']).'?v='.$e->updated_at->timestamp : null,
            ])
            ->values();

        // PDF reading progress — keyed as "courseId:slot" for direct JS lookup
        $progressRows = StudentPdfProgress::where('student_id', $student->id)->get();
        $pdfProgress  = [];
        foreach ($progressRows as $row) {
            $pdfProgress["{$row->course_id}:{$row->pdf_slot}"] = [
                'page'      => $row->current_page,
                'total'     => $row->total_pages,
                'scrollPct' => $row->scroll_pct,
            ];
        }

        return Inertia::render('Student/Dashboard', [
            'student' => [
                'studentNumber'  => $student->student_number,
                'firstName'      => $student->first_name,
                'lastName'       => $student->last_name,
                'firstNameAr'    => $student->first_name_ar,
                'lastNameAr'     => $student->last_name_ar,
                'cin'            => $student->cin,
                'gender'         => $student->gender,
                'birthDate'      => $student->birth_date?->toDateString(),
                'birthplace'     => $student->birthplace,
                'status'         => $student->status,
                'phone'          => $student->phone,
                'enrollmentDate' => $student->enrollment_date?->toDateString(),
                'examLanguage'   => $student->exam_language,
                'lessonsCount'   => $student->lessons_count,
                'lessonsTotal'   => $student->lessons_total,
                'category'       => $student->licenseCategory ? [
                    'id'     => $student->licenseCategory->id,
                    'code'   => $student->licenseCategory->code,
                    'nameAr' => $student->licenseCategory->name_ar,
                    'nameFr' => $student->licenseCategory->name_fr,
                ] : null,
            ],
            'courses'     => $courses,
            'tests'       => $tests,
            'exams'       => $exams,
            'pdfProgress' => $pdfProgress,
        ]);
    }
}
