<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Events\FeeOverdue;
use App\Models\Student;
use App\Models\Tenant;
use App\Services\NotificationService;
use Illuminate\Contracts\Queue\ShouldQueue;

class SendFeeReminder implements ShouldQueue
{
    public function __construct(protected NotificationService $notificationService) {}

    public function handle(FeeOverdue $event): void
    {
        $tenant = Tenant::find($event->tenantId);
        if (! $tenant) {
            return;
        }

        tenancy()->initialize($tenant);

        $student = Student::with(['user', 'parents.user'])->find($event->studentId);
        if (! $student) {
            tenancy()->end();

            return;
        }

        $amountPkr = number_format($event->amountDue / 100, 0);
        $message = "Dear Parent, fee payment of PKR {$amountPkr} for {$student->user->name} for month {$event->monthYear} is OVERDUE. Please clear dues immediately to avoid penalties.";

        $this->notificationService->sendToStudent(
            $student->id,
            'fee_overdue',
            "Fee Overdue — {$event->monthYear}",
            $message,
        );

        tenancy()->end();
    }
}
