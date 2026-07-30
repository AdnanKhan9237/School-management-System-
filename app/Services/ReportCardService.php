<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Exam;
use App\Models\Result;
use App\Models\Student;
use Barryvdh\DomPDF\Facade\Pdf;

class ReportCardService
{
    public function __construct(protected GradingService $gradingService) {}

    public function generate(Student $student, Exam $exam): array
    {
        $results = Result::with('subject')
            ->where('student_id', $student->id)
            ->where('exam_id', $exam->id)
            ->get();

        $totalPossible = $results->sum('total_marks');
        $totalObtained = $results->sum('marks_obtained');
        $percentage = $totalPossible > 0 ? round(($totalObtained / $totalPossible) * 100, 2) : 0;
        $grade = $this->gradingService->calculateGrade($percentage);

        $remarks = match (true) {
            $percentage >= 90 => 'Excellent performance! Outstanding work.',
            $percentage >= 75 => 'Very good performance. Keep it up!',
            $percentage >= 60 => 'Good performance. Room for improvement.',
            $percentage >= 45 => 'Average performance. Need more effort.',
            default => 'Below average. Needs significant improvement.',
        };

        return [
            'student' => [
                'id' => $student->id,
                'name' => $student->user->name,
                'admission_number' => $student->admission_number,
                'class' => $student->schoolClass?->name,
            ],
            'exam' => [
                'id' => $exam->id,
                'name' => $exam->name,
                'academic_year' => $exam->academic_year,
            ],
            'results' => $results->map(fn ($r) => [
                'subject_name' => $r->subject->name,
                'marks_obtained' => $r->marks_obtained,
                'total_marks' => $r->total_marks,
                'grade' => $r->grade,
                'remarks' => $r->remarks,
            ]),
            'summary' => [
                'total_obtained' => $totalObtained,
                'total_possible' => $totalPossible,
                'percentage' => $percentage,
                'grade' => $grade,
                'remarks' => $remarks,
            ],
        ];
    }

    public function generateReportCard(string $studentId, string $examId): array
    {
        $student = Student::with(['user', 'schoolClass'])->findOrFail($studentId);
        $exam = Exam::findOrFail($examId);

        return $this->generate($student, $exam);
    }

    public function generatePdf(Student $student, Exam $exam): string
    {
        $data = $this->generate($student, $exam);

        $pdf = Pdf::loadView('pdf.report_card', array_merge($data, [
            'student' => $student,
            'exam' => $exam,
            'results' => $data['results'],
            'summary' => $data['summary'],
        ]));

        $pdf->setPaper('A4', 'portrait');

        return $pdf->output();
    }
}
