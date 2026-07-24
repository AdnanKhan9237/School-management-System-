<?php

declare(strict_types=1);

namespace App\Repositories\Interfaces;

use Illuminate\Database\Eloquent\Collection;

interface AttendanceRepositoryInterface extends BaseRepositoryInterface
{
    public function forClassOnDate(string $classId, string $date): Collection;

    /**
     * @param  array<string, mixed>  $filters
     */
    public function forStudent(string $studentId, array $filters = []): Collection;
}
