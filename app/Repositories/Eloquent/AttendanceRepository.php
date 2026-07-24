<?php

declare(strict_types=1);

namespace App\Repositories\Eloquent;

use App\Models\Attendance;
use App\Repositories\Interfaces\AttendanceRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class AttendanceRepository extends BaseRepository implements AttendanceRepositoryInterface
{
    public function __construct(Attendance $model)
    {
        parent::__construct($model);
    }

    public function forClassOnDate(string $classId, string $date): Collection
    {
        return $this->model->newQuery()
            ->where('class_id', $classId)
            ->whereDate('date', $date)
            ->with(['student.user'])
            ->get();
    }

    public function forStudent(string $studentId, array $filters = []): Collection
    {
        $query = $this->model->newQuery()
            ->where('student_id', $studentId)
            ->with('schoolClass');

        if (! empty($filters['from'])) {
            $query->whereDate('date', '>=', $filters['from']);
        }

        if (! empty($filters['to'])) {
            $query->whereDate('date', '<=', $filters['to']);
        }

        return $query->orderByDesc('date')->get();
    }
}
