<?php

declare(strict_types=1);

namespace App\Channels;

use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsAppChannel
{
    public function send(mixed $notifiable, Notification $notification): void
    {
        if (! method_exists($notification, 'toWhatsApp')) {
            return;
        }

        $tenant = function_exists('tenant') ? tenant() : null;
        $schoolName = $tenant->name ?? 'School';

        $rawMessage = $notification->toWhatsApp($notifiable);
        $message = "🏫 *{$schoolName}*\n\n{$rawMessage}";
        $phone = $notifiable->phone ?? $notifiable->user?->phone ?? null;

        if (! $phone) {
            return;
        }

        // Per-school WhatsApp / Twilio credentials
        $sid = $tenant->twilio_sid ?? env('TWILIO_SID');
        $token = $tenant->twilio_auth_token ?? env('TWILIO_TOKEN');
        $from = $tenant->whatsapp_sender_number ?? env('TWILIO_WHATSAPP_FROM', 'whatsapp:+14155238886');

        if ($sid && $token && $from) {
            try {
                $recipientPhone = str_starts_with($phone, 'whatsapp:') ? $phone : "whatsapp:{$phone}";
                $senderPhone = str_starts_with($from, 'whatsapp:') ? $from : "whatsapp:{$from}";

                Http::withBasicAuth($sid, $token)
                    ->asForm()
                    ->post("https://api.twilio.com/2010-04-01/Accounts/{$sid}/Messages.json", [
                        'From' => $senderPhone,
                        'To' => $recipientPhone,
                        'Body' => $message,
                    ]);

                Log::channel('single')->info("[WhatsApp Twilio Sent] School: {$schoolName} | To: {$recipientPhone}");
                return;
            } catch (\Throwable $e) {
                Log::channel('single')->error("[WhatsApp Twilio Failed] School: {$schoolName} | To: {$phone} | Error: ".$e->getMessage());
            }
        }

        // Log message for auditing
        Log::channel('single')->info("[WhatsApp Logged] School: {$schoolName} | To: {$phone} | Message: {$message}");
    }
}
