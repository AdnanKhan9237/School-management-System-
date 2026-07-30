<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function __construct(protected NotificationService $notificationService) {}

    public function index(Request $request): JsonResponse
    {
        $notifications = Notification::with('student.user')
            ->when($request->type, fn ($q) => $q->where('type', $request->type))
            ->when($request->student_id, fn ($q) => $q->where('student_id', $request->student_id))
            ->orderByDesc('sent_at')
            ->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $notifications->items(),
            'meta' => ['total' => $notifications->total()],
        ]);
    }

    public function myNotifications(Request $request): JsonResponse
    {
        $user = auth()->user();
        $student = $user->student ?? null;

        if (! $student) {
            return response()->json(['success' => true, 'data' => []]);
        }

        $notifications = Notification::where('student_id', $student->id)
            ->orderByDesc('sent_at')
            ->take(50)
            ->get();

        return response()->json(['success' => true, 'data' => $notifications]);
    }

    public function send(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'student_id' => ['required', 'uuid'],
            'type' => ['required', 'string', 'max:50'],
            'title' => ['required', 'string', 'max:150'],
            'message' => ['required', 'string', 'max:1000'],
            'channels' => ['nullable', 'array'],
            'channels.*' => ['in:sms,whatsapp,app'],
        ]);

        $notification = $this->notificationService->sendToStudent(
            $validated['student_id'],
            $validated['type'],
            $validated['title'],
            $validated['message'],
            $validated['channels'] ?? ['app'],
        );

        return response()->json([
            'success' => true,
            'message' => 'Notification sent.',
            'data' => $notification,
        ], 201);
    }

    public function broadcast(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'class_id' => ['nullable', 'uuid'],
            'type' => ['required', 'string', 'max:50'],
            'title' => ['required', 'string', 'max:150'],
            'message' => ['required', 'string', 'max:1000'],
        ]);

        $query = \App\Models\Student::query();
        if (! empty($validated['class_id'])) {
            $query->where('class_id', $validated['class_id']);
        }

        $count = 0;
        $query->chunk(50, function ($students) use ($validated, &$count) {
            foreach ($students as $student) {
                $this->notificationService->sendToStudent(
                    $student->id,
                    $validated['type'],
                    $validated['title'],
                    $validated['message'],
                );
                $count++;
            }
        });

        return response()->json([
            'success' => true,
            'message' => "Broadcast sent to {$count} students.",
            'data' => ['count' => $count],
        ]);
    }

    public function markRead(string $id): JsonResponse
    {
        $notification = Notification::findOrFail($id);
        $notification->update(['read_at' => now()]);

        return response()->json(['success' => true, 'message' => 'Marked as read.']);
    }
}
