<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Exports\StudentsExport;
use App\Http\Controllers\Controller;
use App\Http\Requests\Student\ImportStudentsRequest;
use App\Http\Requests\Student\IndexStudentsRequest;
use App\Http\Requests\Student\LinkParentRequest;
use App\Http\Requests\Student\StoreStudentRequest;
use App\Http\Requests\Student\TransferStudentRequest;
use App\Http\Requests\Student\UpdateStudentRequest;
use App\Http\Requests\Student\UploadPhotoRequest;
use App\Http\Resources\StudentResource;
use App\Imports\StudentImport;
use App\Models\Student;
use App\Repositories\Interfaces\StudentRepositoryInterface;
use App\Services\StudentService;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class StudentController extends Controller
{
    public function __construct(
        private readonly StudentService $students,
        private readonly StudentRepositoryInterface $repository,
    ) {}

    public function index(IndexStudentsRequest $request): JsonResponse
    {
        $paginator = $this->repository->paginateWithFilters(
            $request->only(['search', 'class_id', 'status']),
            (int) $request->input('per_page', 15),
        );

        $collection = new EloquentCollection($paginator->items());
        $this->students->attachStats($collection);

        return response()->json([
            'success' => true,
            'data' => StudentResource::collection($collection),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
            ],
        ]);
    }

    public function store(StoreStudentRequest $request): JsonResponse
    {
        $student = $this->students->admit($request->validated());
        $this->students->attachStatsToOne($student);

        return response()->json([
            'success' => true,
            'message' => 'Student admitted successfully.',
            'data' => new StudentResource($student),
        ], 201);
    }

    public function show(Student $student): JsonResponse
    {
        $student->load(['user', 'schoolClass', 'parents']);
        $this->students->attachStatsToOne($student);

        return response()->json([
            'success' => true,
            'data' => new StudentResource($student),
        ]);
    }

    public function update(UpdateStudentRequest $request, Student $student): JsonResponse
    {
        $data = $request->validated();

        $userFields = array_intersect_key($data, array_flip([
            'name', 'email', 'phone', 'gender', 'date_of_birth', 'address', 'city',
        ]));
        if (! empty($userFields) && $student->user) {
            $student->user->fill($userFields)->save();
        }

        $studentFields = array_intersect_key($data, array_flip([
            'roll_number', 'father_name', 'mother_name', 'guardian_name',
            'guardian_relation', 'emergency_contact', 'blood_group', 'previous_school', 'status',
        ]));
        if (! empty($studentFields)) {
            $student->fill($studentFields)->save();
        }

        return response()->json([
            'success' => true,
            'message' => 'Student updated successfully.',
            'data' => new StudentResource($student->fresh(['user', 'schoolClass'])),
        ]);
    }

    public function destroy(Student $student): JsonResponse
    {
        $student->delete();

        return response()->json([
            'success' => true,
            'message' => 'Student deleted successfully.',
        ]);
    }

    public function transfer(TransferStudentRequest $request, Student $student): JsonResponse
    {
        $student = $this->students->transfer($student, $request->input('class_id'));

        return response()->json([
            'success' => true,
            'message' => 'Student transferred successfully.',
            'data' => new StudentResource($student),
        ]);
    }

    public function import(ImportStudentsRequest $request): JsonResponse
    {
        $import = new StudentImport($this->students, $request->input('class_id'));
        Excel::import($import, $request->file('file'));

        return response()->json([
            'success' => true,
            'message' => 'Import completed.',
            'data' => [
                'imported' => $import->imported,
                'errors' => $import->errors,
            ],
        ]);
    }

    public function export(Request $request): BinaryFileResponse
    {
        return Excel::download(
            new StudentsExport($request->only(['class_id', 'status'])),
            'students.xlsx',
        );
    }

    public function attendanceSummary(Student $student): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $this->students->attendanceSummary($student),
        ]);
    }

    public function feeHistory(Student $student): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $this->students->feeHistory($student),
        ]);
    }

    public function results(Student $student): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $this->students->results($student),
        ]);
    }

    public function photo(UploadPhotoRequest $request, Student $student): JsonResponse
    {
        $path = $this->students->uploadPhoto($student, $request->file('photo'));

        return response()->json([
            'success' => true,
            'message' => 'Photo uploaded successfully.',
            'data' => ['photo' => $path],
        ]);
    }

    public function linkParent(LinkParentRequest $request, Student $student): JsonResponse
    {
        $this->students->linkParent(
            $student,
            $request->input('parent_id'),
            $request->input('relation'),
            $request->boolean('is_primary'),
        );

        return response()->json([
            'success' => true,
            'message' => 'Parent linked successfully.',
            'data' => new StudentResource($student->fresh(['user', 'schoolClass', 'parents'])),
        ]);
    }
}
