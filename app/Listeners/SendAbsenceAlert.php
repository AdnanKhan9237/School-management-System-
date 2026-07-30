<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Events\StudentMarkedAbsent;
use App\Models\Student;
use App\Services\NotificationService;
use Illuminate\Contracts\Queue\ShouldQueue;

class SendAbsenceAlert implements ShouldQueue
{
    public function __construct(protected NotificationService $notificationService) {}

    public function handle(StudentMarkedAbsent $event): void
    {
        $tenant = \App\Models\Tenant::find($event->tenantId);
        if (! $tenant) {
            return;
        }

        tenancy()->initialize($tenant);

        $student = Student::with(['user', 'parents.user'])->find($event->studentId);
        if (! $student) {
            tenancy()->end();
            return;
        }

        $message = "Dear Parent, your child {$student->user->name} was marked ABSENT on {$event->date}. Please contact the school if needed.";

        $this->notificationService->sendAttendanceAlert($student, $event->date, $message);

        tenancy()->end();
    }
}
