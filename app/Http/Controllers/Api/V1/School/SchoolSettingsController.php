<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\School;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SchoolSettingsController extends Controller
{
    public function show(): JsonResponse
    {
        $tenant = tenant();

        return response()->json([
            'success' => true,
            'data' => [
                'timezone' => $tenant->timezone ?? 'Asia/Karachi',
                'currency' => $tenant->currency ?? 'PKR',
                'academic_year' => $tenant->academic_year ?? date('Y'),
                'date_format' => $tenant->date_format ?? 'Y-m-d',
                'sms_notifications_enabled' => (bool) ($tenant->sms_notifications_enabled ?? true),
                'whatsapp_notifications_enabled' => (bool) ($tenant->whatsapp_notifications_enabled ?? false),
                'twilio_sid' => $tenant->twilio_sid ?? '',
                'twilio_auth_token' => $tenant->twilio_auth_token ?? '',
                'twilio_from_number' => $tenant->twilio_from_number ?? '',
                'whatsapp_sender_number' => $tenant->whatsapp_sender_number ?? '',
            ],
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'timezone' => 'sometimes|string|max:100',
            'currency' => 'sometimes|string|max:10',
            'academic_year' => 'sometimes|string|max:20',
            'date_format' => 'sometimes|string|max:20',
            'sms_notifications_enabled' => 'sometimes|boolean',
            'whatsapp_notifications_enabled' => 'sometimes|boolean',
            'twilio_sid' => 'sometimes|nullable|string|max:255',
            'twilio_auth_token' => 'sometimes|nullable|string|max:255',
            'twilio_from_number' => 'sometimes|nullable|string|max:255',
            'whatsapp_sender_number' => 'sometimes|nullable|string|max:255',
        ]);

        $tenant = tenant();
        $tenant->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'School settings updated successfully.',
            'data' => [
                'timezone' => $tenant->timezone ?? 'Asia/Karachi',
                'currency' => $tenant->currency ?? 'PKR',
                'academic_year' => $tenant->academic_year ?? date('Y'),
                'date_format' => $tenant->date_format ?? 'Y-m-d',
                'sms_notifications_enabled' => (bool) ($tenant->sms_notifications_enabled ?? true),
                'whatsapp_notifications_enabled' => (bool) ($tenant->whatsapp_notifications_enabled ?? false),
                'twilio_sid' => $tenant->twilio_sid ?? '',
                'twilio_auth_token' => $tenant->twilio_auth_token ?? '',
                'twilio_from_number' => $tenant->twilio_from_number ?? '',
                'whatsapp_sender_number' => $tenant->whatsapp_sender_number ?? '',
            ],
        ]);
    }
}
