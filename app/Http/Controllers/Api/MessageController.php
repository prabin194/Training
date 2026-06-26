<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Message;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MessageController extends Controller
{
    public function inbox(Request $request): JsonResponse
    {
        $user = $request->user();

        $messages = Message::with('sender:id,name,email')
            ->where('receiver_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'messages' => $messages,
            'unread_count' => Message::where('receiver_id', $user->id)->unread()->count(),
        ]);
    }

    public function sent(Request $request): JsonResponse
    {
        $user = $request->user();

        $messages = Message::with('receiver:id,name,email')
            ->where('sender_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'messages' => $messages,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'receiver_id' => 'required|exists:users,id',
            'subject' => 'required|string|max:255',
            'body' => 'required|string',
            'parent_id' => 'nullable|exists:messages,id',
        ]);

        $user = $request->user();

        // Prevent sending to self
        if ((int) $validated['receiver_id'] === $user->id) {
            return response()->json(['message' => 'You cannot send a message to yourself.'], 422);
        }

        $message = Message::create([
            'sender_id' => $user->id,
            'receiver_id' => $validated['receiver_id'],
            'subject' => $validated['subject'],
            'body' => $validated['body'],
            'parent_id' => $validated['parent_id'] ?? null,
        ]);

        // Create notification for the receiver
        Notification::notify(
            User::find($validated['receiver_id']),
            'new_message',
            "New message from {$user->name}",
            $validated['subject'],
            ['message_id' => $message->id, 'sender_id' => $user->id]
        );

        return response()->json([
            'message' => $message->load('receiver:id,name,email'),
        ], 201);
    }

    public function show(Request $request, Message $message): JsonResponse
    {
        $user = $request->user();

        // Only sender or receiver can view
        abort_unless($message->sender_id === $user->id || $message->receiver_id === $user->id, 403);

        $message->load('sender:id,name,email', 'receiver:id,name,email');

        // Auto-mark as read when the receiver views it
        if ($message->receiver_id === $user->id && $message->isUnread()) {
            $message->markAsRead();
        }

        return response()->json([
            'message' => $message,
        ]);
    }

    public function destroy(Request $request, Message $message): JsonResponse
    {
        $user = $request->user();

        abort_unless($message->sender_id === $user->id || $message->receiver_id === $user->id, 403);

        $message->delete();

        return response()->json(['message' => 'Message deleted.']);
    }

    public function users(Request $request): JsonResponse
    {
        $user = $request->user();

        $users = User::where('id', '!=', $user->id)
            ->select('id', 'name', 'email')
            ->orderBy('name')
            ->get();

        return response()->json(['users' => $users]);
    }
}
