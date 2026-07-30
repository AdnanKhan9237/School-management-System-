<?php

declare(strict_types=1);

namespace App\Channels;

use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Log;

class SMSChannel
{
    public function send(mixed $notifiable, Notification $notification): void
    {
        if (! method_exists($notification, 'toSMS')) {
            return;
        }

        $message = $notification->toSMS($notifiable);
        $phone = $notifiable->phone ?? $notifiable->user?->phone ?? null;

        if (! $phone) {
            return;
        }

        // Log the message — replace with SMS gateway (Telenor, Jazz, Twilio, etc.)
        Log::channel('single')->info('[SMS] To: ' . $phone . ' | Message: ' . $message);
    }
}
