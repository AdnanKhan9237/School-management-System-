<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\Notification;
use App\Models\Student;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * Notifies the parents of absent students (WhatsApp/SMS). Dispatched after
 * attendance is marked. Runs in the originating tenant's context thanks to
 * stancl/tenancy's QueueTenancyBootstrapper (only scalar data is passed so no
 * cross-database model serialization is required).
 */
class MarkAttendanceJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    /**
     * @param  array<int, string>  $absentStudentIds
     */
    public function __construct(
        public array $absentStudentIds,
        public string $classId,
        public string $date,
        public string $markedById,
    ) {}

    public function handle(): void
    {
        if (empty($this->absentStudentIds)) {
            return;
        }

        $students = Student::whereIn('id', $this->absentStudentIds)
            ->with(['user', 'parents'])
            ->get();

        foreach ($students as $student) {
            $studentName = $student->user?->name ?? 'Student';
            $message = sprintf(
                'Dear Parent, your child %s (Adm# %s) was marked ABSENT on %s.',
                $studentName,
                $student->admission_number,
                $this->date,
            );

            $parents = $student->parents;

            if ($parents->isEmpty()) {
                Log::info('[ATTENDANCE][no-parent] '.$message);

                continue;
            }

            foreach ($parents as $parent) {
                Notification::create([
                    'title' => 'Absence Alert',
                    'message' => $message,
                    'type' => 'attendance',
                    'channel' => 'whatsapp',
                    'recipient_type' => 'parent',
                    'recipient_id' => $parent->id,
                    'sent_at' => now(),
                    'status' => 'sent',
                    'created_by' => $this->markedById,
                ]);

                Log::info('[ATTENDANCE][whatsapp] '.($parent->phone ?? 'n/a').': '.$message);
            }
        }
    }
}
