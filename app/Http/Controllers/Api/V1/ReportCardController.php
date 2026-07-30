<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Exam;
use App\Models\Student;
use App\Services\ReportCardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class ReportCardController extends Controller
{
    public function __construct(protected ReportCardService $reportCardService) {}

    public function student(Request $request, string $studentId): JsonResponse
    {
        $request->validate(['exam_id' => ['required', 'uuid']]);

        $student = Student::with(['user', 'schoolClass'])->findOrFail($studentId);
        $exam = Exam::findOrFail($request->exam_id);

        $card = $this->reportCardService->generate($student, $exam);

        return response()->json(['success' => true, 'data' => $card]);
    }

    public function classCards(Request $request): JsonResponse
    {
        $request->validate([
            'exam_id' => ['required', 'uuid'],
            'class_id' => ['required', 'uuid'],
        ]);

        $exam = Exam::findOrFail($request->exam_id);
        $students = Student::with(['user', 'results' => fn ($q) => $q->where('exam_id', $exam->id)->with('subject')])
            ->where('class_id', $request->class_id)
            ->get();

        $cards = $students->map(fn ($s) => $this->reportCardService->generate($s, $exam));

        return response()->json(['success' => true, 'data' => $cards]);
    }

    public function pdf(Request $request, string $studentId): Response
    {
        $request->validate(['exam_id' => ['required', 'uuid']]);

        $student = Student::with(['user', 'schoolClass'])->findOrFail($studentId);
        $exam = Exam::findOrFail($request->exam_id);

        $pdf = $this->reportCardService->generatePdf($student, $exam);

        return response($pdf, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => "inline; filename=report-card-{$student->admission_number}.pdf",
        ]);
    }
}
