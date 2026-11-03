<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\StudentPdfProgress;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PdfProgressController extends Controller
{
    /**
     * Save (upsert) reading progress for a course PDF.
     *
     * POST /student/pdf-progress
     */
    public function save(Request $request): JsonResponse
    {
        $student = $request->user()->studentProfile()->first();

        abort_unless($student !== null, 403);

        $data = $request->validate([
            'course_id'    => ['required', 'integer', Rule::exists(Course::class, 'id')],
            'pdf_slot'     => ['required', Rule::in(['fr', 'ar'])],
            'current_page' => ['required', 'integer', 'min:1'],
            'total_pages'  => ['required', 'integer', 'min:1'],
            'scroll_pct'   => ['required', 'integer', 'min:0', 'max:100'],
        ]);

        // Confirm the course belongs to the student's category
        $course = Course::findOrFail($data['course_id']);
        abort_unless($course->license_category_id === $student->license_category_id, 403);

        StudentPdfProgress::updateOrCreate(
            [
                'student_id' => $student->id,
                'course_id'  => $data['course_id'],
                'pdf_slot'   => $data['pdf_slot'],
            ],
            [
                'current_page' => $data['current_page'],
                'total_pages'  => $data['total_pages'],
                'scroll_pct'   => $data['scroll_pct'],
            ]
        );

        return response()->json(['ok' => true]);
    }

    /**
     * Return all progress records for the authenticated student.
     * Keyed by "courseId:slot" for easy lookup in JS.
     *
     * GET /student/pdf-progress
     */
    public function index(Request $request): JsonResponse
    {
        $student = $request->user()->studentProfile()->first();

        abort_unless($student !== null, 403);

        $rows = StudentPdfProgress::where('student_id', $student->id)
            ->get(['course_id', 'pdf_slot', 'current_page', 'total_pages', 'scroll_pct']);

        $map = [];
        foreach ($rows as $row) {
            $map["{$row->course_id}:{$row->pdf_slot}"] = [
                'page'      => $row->current_page,
                'total'     => $row->total_pages,
                'scrollPct' => $row->scroll_pct,
            ];
        }

        return response()->json($map);
    }
}
