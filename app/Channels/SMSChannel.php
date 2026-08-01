<?php

declare(strict_types=1);

namespace App\Channels;

use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SMSChannel
{
    public function send(mixed $notifiable, Notification $notification): void
    {
        if (! method_exists($notification, 'toSMS')) {
            return;
        }

        $tenant = function_exists('tenant') ? tenant() : null;
        $schoolName = $tenant->name ?? 'School';

        $rawMessage = $notification->toSMS($notifiable);
        $message = "[{$schoolName}]: {$rawMessage}";
        $phone = $notifiable->phone ?? $notifiable->user?->phone ?? null;

        if (! $phone) {
            return;
        }

        // Per-school Twilio credentials or fallback to central .env
        $sid = $tenant->twilio_sid ?? env('TWILIO_SID');
        $token = $tenant->twilio_auth_token ?? env('TWILIO_TOKEN');
        $from = $tenant->twilio_from_number ?? env('TWILIO_FROM');

        if ($sid && $token && $from) {
            try {
                Http::withBasicAuth($sid, $token)
                    ->asForm()
                    ->post("https://api.twilio.com/2010-04-01/Accounts/{$sid}/Messages.json", [
                        'From' => $from,
                        'To' => $phone,
                        'Body' => $message,
                    ]);
                Log::channel('single')->info("[SMS Twilio Sent] School: {$schoolName} | To: {$phone}");

                return;
            } catch (\Throwable $e) {
                Log::channel('single')->error("[SMS Twilio Failed] School: {$schoolName} | To: {$phone} | Error: ".$e->getMessage());
            }
        }

        // Default / Fallback: Log message for auditing
        Log::channel('single')->info("[SMS Logged] School: {$schoolName} | To: {$phone} | Message: {$message}");
    }
}
