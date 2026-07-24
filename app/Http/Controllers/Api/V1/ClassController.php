<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Student\StoreClassRequest;
use App\Http\Resources\ClassResource;
use App\Http\Resources\StudentResource;
use App\Models\SchoolClass;
use App\Models\Timetable;
use App\Services\StudentService;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Http\JsonResponse;

class ClassController extends Controller
{
    public function __construct(private readonly StudentService $students) {}

    public function index(): JsonResponse
    {
        $classes = SchoolClass::query()
            ->withCount('students')
            ->with('classTeacher')
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'data' => ClassResource::collection($classes),
        ]);
    }

    public function store(StoreClassRequest $request): JsonResponse
    {
        $class = SchoolClass::create($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Class created successfully.',
            'data' => new ClassResource($class),
        ], 201);
    }

    public function show(SchoolClass $class): JsonResponse
    {
        $class->load(['classTeacher', 'students.user'])->loadCount('students');

        $this->students->attachStats(new EloquentCollection($class->students->all()));

        return response()->json([
            'success' => true,
            'data' => new ClassResource($class),
        ]);
    }

    public function students(SchoolClass $class): JsonResponse
    {
        $students = $class->students()->with('user')->get();
        $this->students->attachStats($students);

        return response()->json([
            'success' => true,
            'data' => StudentResource::collection($students),
        ]);
    }

    public function timetable(SchoolClass $class): JsonResponse
    {
        $slots = Timetable::where('class_id', $class->id)
            ->with(['subject', 'teacher'])
            ->orderByRaw("array_position(array['monday','tuesday','wednesday','thursday','friday','saturday']::text[], day_of_week)")
            ->orderBy('start_time')
            ->get()
            ->groupBy('day_of_week');

        return response()->json([
            'success' => true,
            'data' => $slots,
        ]);
    }
}
