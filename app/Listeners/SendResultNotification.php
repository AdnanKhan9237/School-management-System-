<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Events\ResultPublished;
use App\Models\Exam;
use App\Models\Student;
use App\Services\NotificationService;
use Illuminate\Contracts\Queue\ShouldQueue;

class SendResultNotification implements ShouldQueue
{
    public function __construct(protected NotificationService $notificationService) {}

    public function handle(ResultPublished $event): void
    {
        $tenant = \App\Models\Tenant::find($event->tenantId);
        if (! $tenant) {
            return;
        }

        tenancy()->initialize($tenant);

        $exam = Exam::find($event->examId);
        $students = Student::with('user')->where('class_id', $event->classId)->get();

        foreach ($students as $student) {
            $this->notificationService->sendToStudent(
                $student->id,
                'result_published',
                "Results Published — {$exam->name}",
                "Dear {$student->user->name}, your results for {$exam->name} have been published. Please check your report card.",
            );
        }

        tenancy()->end();
    }
}
