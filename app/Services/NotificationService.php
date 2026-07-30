<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Notification;
use Illuminate\Support\Facades\Log;

class NotificationService
{
    public function notify(string $channel, array $payload): void
    {
        Log::info("Dispatching notification via channel [{$channel}]", $payload);
    }

    public function sendToStudent(string $studentId, string $title, string $message, array $channels = ['app']): Notification
    {
        return Notification::create([
            'title' => $title,
            'message' => $message,
            'type' => 'general',
            'channel' => $channels[0] ?? 'app',
            'recipient_type' => 'student',
            'recipient_id' => $studentId,
            'status' => 'sent',
            'sent_at' => now(),
            'created_by' => auth()->id() ?? 'system',
        ]);
    }

    public function sendAttendanceAlert(string $studentId, string $date): Notification
    {
        $message = "Assalam-o-Alaikum! Your child was absent on {$date}. Please contact the school if you have any query.";

        return Notification::create([
            'title' => 'Attendance Alert',
            'message' => $message,
            'type' => 'attendance',
            'channel' => 'whatsapp',
            'recipient_type' => 'parent',
            'recipient_id' => $studentId,
            'status' => 'sent',
            'sent_at' => now(),
            'created_by' => auth()->id() ?? 'system',
        ]);
    }
}
