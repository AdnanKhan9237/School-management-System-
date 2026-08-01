<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Timetable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TimetableController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Timetable::with(['schoolClass', 'subject', 'teacher']);

        if ($request->has('class_id')) {
            $query->where('class_id', $request->input('class_id'));
        }

        if ($request->has('teacher_id')) {
            $query->where('teacher_id', $request->input('teacher_id'));
        }

        if ($request->has('day_of_week')) {
            $query->where('day_of_week', $request->input('day_of_week'));
        }

        $timetables = $query->orderBy('day_of_week')->orderBy('start_time')->get();

        return response()->json([
            'success' => true,
            'data' => $timetables,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'class_id' => 'required|uuid|exists:classes,id',
            'subject_id' => 'required|uuid|exists:subjects,id',
            'teacher_id' => 'nullable|uuid|exists:users,id',
            'day_of_week' => 'required|string|in:Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday',
            'start_time' => 'required|string',
            'end_time' => 'required|string',
            'room_number' => 'nullable|string|max:50',
            'academic_year' => 'nullable|string|max:20',
        ]);

        $timetable = Timetable::create($validated);
        $timetable->load(['schoolClass', 'subject', 'teacher']);

        return response()->json([
            'success' => true,
            'message' => 'Timetable entry created successfully.',
            'data' => $timetable,
        ], 201);
    }

    public function update(Request $request, Timetable $timetable): JsonResponse
    {
        $validated = $request->validate([
            'class_id' => 'sometimes|uuid|exists:classes,id',
            'subject_id' => 'sometimes|uuid|exists:subjects,id',
            'teacher_id' => 'nullable|uuid|exists:users,id',
            'day_of_week' => 'sometimes|string|in:Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday',
            'start_time' => 'sometimes|string',
            'end_time' => 'sometimes|string',
            'room_number' => 'nullable|string|max:50',
            'academic_year' => 'nullable|string|max:20',
            'is_active' => 'sometimes|boolean',
        ]);

        $timetable->update($validated);
        $timetable->load(['schoolClass', 'subject', 'teacher']);

        return response()->json([
            'success' => true,
            'message' => 'Timetable entry updated successfully.',
            'data' => $timetable,
        ]);
    }

    public function destroy(Timetable $timetable): JsonResponse
    {
        $timetable->delete();

        return response()->json([
            'success' => true,
            'message' => 'Timetable entry deleted successfully.',
        ]);
    }
}
