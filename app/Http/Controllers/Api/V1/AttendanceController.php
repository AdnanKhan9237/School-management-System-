<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Attendance\MarkAttendanceRequest;
use App\Http\Requests\Attendance\MarkSingleAttendanceRequest;
use App\Http\Requests\Attendance\UpdateAttendanceRequest;
use App\Http\Resources\AttendanceResource;
use App\Models\Attendance;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Reports\AttendanceReport;
use App\Repositories\Interfaces\AttendanceRepositoryInterface;
use App\Services\AttendanceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class AttendanceController extends Controller
{
    public function __construct(
        private readonly AttendanceService $attendance,
        private readonly AttendanceRepositoryInterface $repository,
    ) {}

    public function mark(MarkAttendanceRequest $request): JsonResponse
    {
        $summary = $this->attendance->markBulk($request->validated(), $request->user()->getAuthIdentifier());

        return response()->json([
            'success' => true,
            'message' => 'Attendance marked successfully.',
            'data' => $summary,
        ], 201);
    }

    public function markSingle(MarkSingleAttendanceRequest $request): JsonResponse
    {
        $attendance = $this->attendance->markSingle($request->validated(), $request->user()->getAuthIdentifier());

        return response()->json([
            'success' => true,
            'message' => 'Attendance recorded.',
            'data' => new AttendanceResource($attendance),
        ], 201);
    }

    public function update(UpdateAttendanceRequest $request, Attendance $attendance): JsonResponse
    {
        $attendance = $this->attendance->update($attendance, $request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Attendance updated.',
            'data' => new AttendanceResource($attendance),
        ]);
    }

    public function today(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $this->attendance->summary(now()->toDateString()),
        ]);
    }

    public function classOnDate(Request $request, SchoolClass $class): JsonResponse
    {
        $date = $request->input('date', now()->toDateString());

        return response()->json([
            'success' => true,
            'data' => [
                'summary' => $this->attendance->classSummary($class->id, $date),
                'records' => AttendanceResource::collection($this->repository->forClassOnDate($class->id, $date)),
            ],
        ]);
    }

    public function studentHistory(Request $request, Student $student): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => [
                'summary' => [
                    'cached_percentage' => $this->attendance->cachedPercentage($student->id),
                ],
                'records' => AttendanceResource::collection(
                    $this->repository->forStudent($student->id, $request->only(['from', 'to'])),
                ),
            ],
        ]);
    }

    public function summary(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $this->attendance->summary($request->input('date')),
        ]);
    }

    public function monthlyReport(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $this->attendance->monthlyReport($request->only(['month', 'class_id', 'student_id'])),
        ]);
    }

    public function lowReport(Request $request): JsonResponse
    {
        $threshold = (float) $request->input('threshold', AttendanceService::LOW_ATTENDANCE_THRESHOLD);

        return response()->json([
            'success' => true,
            'data' => [
                'threshold' => $threshold,
                'students' => $this->attendance->lowAttendance($threshold),
            ],
        ]);
    }

    public function export(Request $request): BinaryFileResponse
    {
        return Excel::download(
            new AttendanceReport($request->only(['class_id', 'from', 'to', 'status'])),
            'attendance.xlsx',
        );
    }
}
