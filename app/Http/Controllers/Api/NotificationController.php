<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $notifications = Notification::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        $unreadCount = Notification::where('user_id', $user->id)->unread()->count();

        return response()->json([
            'notifications' => $notifications,
            'unread_count' => $unreadCount,
        ]);
    }

    public function unreadCount(Request $request): JsonResponse
    {
        $user = $request->user();

        $count = Notification::where('user_id', $user->id)->unread()->count();

        return response()->json(['count' => $count]);
    }

    public function markRead(Request $request, Notification $notification): JsonResponse
    {
        $user = $request->user();

        abort_unless($notification->user_id === $user->id, 403);

        $notification->markAsRead();

        return response()->json(['notification' => $notification]);
    }

    public function markAllRead(Request $request): JsonResponse
    {
        $user = $request->user();

        $updated = Notification::where('user_id', $user->id)
            ->unread()
            ->update(['read_at' => now()]);

        return response()->json(['marked_read' => $updated]);
    }
}
