<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Exam\StoreResultsRequest;
use App\Http\Resources\ResultResource;
use App\Models\Exam;
use App\Models\Result;
use App\Services\GradingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ResultController extends Controller
{
    public function __construct(protected GradingService $gradingService) {}

    public function index(Request $request): JsonResponse
    {
        $results = Result::with(['student.user', 'subject'])
            ->when($request->exam_id, fn ($q) => $q->where('exam_id', $request->exam_id))
            ->when($request->student_id, fn ($q) => $q->where('student_id', $request->student_id))
            ->when($request->class_id, fn ($q) => $q->whereHas('student', fn ($s) => $s->where('class_id', $request->class_id)))
            ->get();

        return response()->json(['success' => true, 'data' => ResultResource::collection($results)]);
    }

    public function bulkStore(StoreResultsRequest $request, Exam $exam): JsonResponse
    {
        $created = [];

        foreach ($request->results as $resultData) {
            $percentage = $resultData['total_marks'] > 0
                ? ($resultData['marks_obtained'] / $resultData['total_marks']) * 100
                : 0;

            $grade = $this->gradingService->calculateGrade($percentage);

            $result = Result::updateOrCreate(
                [
                    'exam_id' => $exam->id,
                    'student_id' => $resultData['student_id'],
                    'subject_id' => $resultData['subject_id'],
                ],
                array_merge($resultData, [
                    'exam_id' => $exam->id,
                    'grade' => $grade,
                ])
            );

            $created[] = $result;
        }

        return response()->json([
            'success' => true,
            'message' => count($created) . ' result(s) saved.',
            'data' => ResultResource::collection(collect($created)->load('student.user', 'subject')),
        ]);
    }

    public function examResults(Exam $exam): JsonResponse
    {
        $results = Result::with(['student.user', 'subject'])
            ->where('exam_id', $exam->id)
            ->get();

        $ranked = $this->gradingService->rankStudents($results->groupBy('student_id'));

        return response()->json([
            'success' => true,
            'data' => $ranked,
        ]);
    }
}
