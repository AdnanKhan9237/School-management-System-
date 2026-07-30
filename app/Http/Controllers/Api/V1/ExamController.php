<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Exam\StoreExamRequest;
use App\Http\Resources\ExamResource;
use App\Models\Exam;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExamController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $exams = Exam::withCount('results')
            ->with('schoolClass')
            ->when($request->class_id, fn ($q) => $q->where('class_id', $request->class_id))
            ->when($request->academic_year, fn ($q) => $q->where('academic_year', $request->academic_year))
            ->orderByDesc('start_date')
            ->get();

        return response()->json(['success' => true, 'data' => ExamResource::collection($exams)]);
    }

    public function store(StoreExamRequest $request): JsonResponse
    {
        $exam = Exam::create(array_merge($request->validated(), ['status' => 'scheduled']));

        return response()->json([
            'success' => true,
            'message' => 'Exam created.',
            'data' => new ExamResource($exam->load('schoolClass')),
        ], 201);
    }

    public function show(Exam $exam): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => new ExamResource($exam->loadCount('results')->load('schoolClass')),
        ]);
    }

    public function update(StoreExamRequest $request, Exam $exam): JsonResponse
    {
        $exam->update($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Exam updated.',
            'data' => new ExamResource($exam->fresh('schoolClass')),
        ]);
    }

    public function destroy(Exam $exam): JsonResponse
    {
        $exam->delete();

        return response()->json(['success' => true, 'message' => 'Exam deleted.']);
    }

    public function publish(Exam $exam): JsonResponse
    {
        $exam->update(['status' => 'published', 'result_date' => now()]);

        return response()->json([
            'success' => true,
            'message' => 'Exam results published.',
            'data' => new ExamResource($exam),
        ]);
    }
}
