<?php

declare(strict_types=1);

namespace App\Channels;

use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Log;

class WhatsAppChannel
{
    public function send(mixed $notifiable, Notification $notification): void
    {
        if (! method_exists($notification, 'toWhatsApp')) {
            return;
        }

        $message = $notification->toWhatsApp($notifiable);
        $phone = $notifiable->phone ?? $notifiable->user?->phone ?? null;

        if (! $phone) {
            return;
        }

        // Log the message — replace with actual WhatsApp Business API (Twilio, Meta, etc.)
        Log::channel('single')->info('[WhatsApp] To: ' . $phone . ' | Message: ' . $message);
    }
}
