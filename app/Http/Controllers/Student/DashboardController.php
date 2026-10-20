<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $student = $request->user()->studentProfile()->with('licenseCategory')->first();

        return Inertia::render('Student/Dashboard', [
            'student' => $student ? [
                'studentNumber' => $student->student_number,
                'status' => $student->status,
                'phone' => $student->phone,
                'enrollmentDate' => $student->enrollment_date?->toDateString(),
                'category' => $student->licenseCategory ? [
                    'code' => $student->licenseCategory->code,
                    'nameAr' => $student->licenseCategory->name_ar,
                    'nameFr' => $student->licenseCategory->name_fr,
                ] : null,
            ] : null,
        ]);
    }
}
