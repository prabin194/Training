<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\PublishToSocialJob;
use App\Models\ScheduleEntry;
use App\Models\ActivityLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ScheduleController extends Controller
{
    /**
     * Get all schedule entries for the calendar view.
     */
    public function index(Request $request): JsonResponse
    {
        $query = ScheduleEntry::with(['post:id,title', 'socialConnection:id,name,provider'])
            ->where('user_id', $request->user()->id)
            ->orderBy('scheduled_at', 'asc');

        // Optional date range filter (for calendar)
        if ($request->filled('start')) {
            $query->where('scheduled_at', '>=', $request->start);
        }
        if ($request->filled('end')) {
            $query->where('scheduled_at', '<=', $request->end);
        }

        $entries = $query->get()->map(fn (ScheduleEntry $entry) => [
            'id' => (string) $entry->id,
            'title' => $entry->post?->title ?? 'Social Post',
            'start' => $entry->scheduled_at->toIso8601String(),
            'allDay' => false,
            'extendedProps' => [
                'platform' => $entry->platform,
                'status' => $entry->status,
                'content' => $entry->content,
                'image_url' => $entry->image_url,
                'account_name' => $entry->socialConnection?->name,
                'post_id' => $entry->post_id,
                'failure_reason' => $entry->failure_reason,
                'retry_count' => $entry->retry_count,
            ],
            // Color-code by status
            'backgroundColor' => match ($entry->status) {
                'pending' => '#6366f1',    // indigo
                'processing' => '#f59e0b',  // amber
                'published' => '#22c55e',   // green
                'failed' => '#ef4444',      // red
                default => '#6b7280',       // gray
            },
            'borderColor' => match ($entry->status) {
                'pending' => '#6366f1',
                'processing' => '#f59e0b',
                'published' => '#22c55e',
                'failed' => '#ef4444',
                default => '#6b7280',
            },
        ]);

        return response()->json(['entries' => $entries]);
    }

    /**
     * Create a new schedule entry.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'post_id' => 'nullable|exists:posts,id',
            'social_connection_id' => 'required|exists:social_connections,id',
            'platform' => 'required|string|in:facebook,instagram',
            'content' => 'nullable|string|max:2200',
            'image_url' => ['nullable', 'string', 'max:2048',
                function ($attribute, $value, $fail) use ($request) {
                    if ($request->platform === 'instagram' && blank($value)) {
                        $fail('Instagram posts require an image URL.');
                    }
                },
            ],
            'scheduled_at' => 'required|date|after:now',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();
        $data['user_id'] = $request->user()->id;

        $entry = ScheduleEntry::create($data);

        ActivityLog::log(
            $request->user(),
            'schedule_created',
            "Scheduled a {$data['platform']} post for {$entry->scheduled_at->format('M j, Y g:i A')}."
        );

        $entry->load(['post:id,title', 'socialConnection:id,name,provider']);

        return response()->json([
            'message' => 'Post scheduled successfully.',
            'entry' => $entry,
        ], 201);
    }

    /**
     * Update a schedule entry (e.g., reschedule via drag-and-drop).
     */
    public function update(Request $request, ScheduleEntry $entry): JsonResponse
    {
        abort_unless($entry->user_id === $request->user()->id, 403);

        if ($entry->status !== 'pending') {
            return response()->json(['message' => 'Only pending entries can be modified.'], 422);
        }

        $validator = Validator::make($request->all(), [
            'post_id' => 'nullable|exists:posts,id',
            'social_connection_id' => 'sometimes|exists:social_connections,id',
            'platform' => 'sometimes|in:facebook,instagram',
            'content' => 'nullable|string|max:2200',
            'image_url' => 'nullable|string|max:2048',
            'scheduled_at' => 'required_without:content|date',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();

        // Validate past-time scheduling
        if (isset($data['scheduled_at'])) {
            $scheduledAt = \Carbon\Carbon::parse($data['scheduled_at']);
            if ($scheduledAt->isPast()) {
                return response()->json(['message' => 'Cannot schedule a post in the past.'], 422);
            }
        }

        $entry->update($data);

        ActivityLog::log(
            $request->user(),
            'schedule_updated',
            "Updated scheduled {$entry->platform} post."
        );

        return response()->json([
            'message' => 'Schedule updated successfully.',
            'entry' => $entry->fresh()->load(['post:id,title', 'socialConnection:id,name,provider']),
        ]);
    }

    /**
     * Delete a schedule entry.
     */
    public function destroy(Request $request, ScheduleEntry $entry): JsonResponse
    {
        abort_unless($entry->user_id === $request->user()->id, 403);

        if (!in_array($entry->status, ['pending', 'failed'])) {
            return response()->json(['message' => 'Only pending or failed entries can be deleted.'], 422);
        }

        $entry->delete();

        ActivityLog::log(
            $request->user(),
            'schedule_deleted',
            "Deleted scheduled {$entry->platform} post."
        );

        return response()->json(['message' => 'Schedule entry deleted.']);
    }

    /**
     * Reschedule via drag-and-drop (accepts new start date).
     */
    public function reschedule(Request $request, ScheduleEntry $entry): JsonResponse
    {
        abort_unless($entry->user_id === $request->user()->id, 403);

        $request->validate([
            'scheduled_at' => 'required|date|after:now',
        ]);

        if ($entry->status !== 'pending') {
            return response()->json(['message' => 'Only pending entries can be rescheduled.'], 422);
        }

        $entry->update([
            'scheduled_at' => $request->scheduled_at,
        ]);

        return response()->json([
            'message' => 'Entry rescheduled.',
            'entry' => $entry->fresh()->load(['post:id,title', 'socialConnection:id,name,provider']),
        ]);
    }

    /**
     * Get publishing history with pagination and filters.
     */
    public function history(Request $request): JsonResponse
    {
        $query = ScheduleEntry::with(['post:id,title', 'socialConnection:id,name,provider'])
            ->where('user_id', $request->user()->id)
            ->orderBy('created_at', 'desc');

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filter by platform
        if ($request->filled('platform')) {
            $query->where('platform', $request->platform);
        }

        // Filter by date range
        if ($request->filled('from')) {
            $query->where('scheduled_at', '>=', $request->from);
        }
        if ($request->filled('to')) {
            $query->where('scheduled_at', '<=', $request->to);
        }

        $entries = $query->paginate($request->per_page ?? 20);

        // Transform to match a clean history format
        $entries->getCollection()->transform(fn (ScheduleEntry $entry) => [
            'id' => $entry->id,
            'platform' => $entry->platform,
            'content' => $entry->content,
            'image_url' => $entry->image_url,
            'scheduled_at' => $entry->scheduled_at->toIso8601String(),
            'published_at' => $entry->published_at?->toIso8601String(),
            'status' => $entry->status,
            'failure_reason' => $entry->failure_reason,
            'retry_count' => $entry->retry_count,
            'post_title' => $entry->post?->title,
            'account_name' => $entry->socialConnection?->name,
            'created_at' => $entry->created_at->toIso8601String(),
        ]);

        return response()->json($entries);
    }

    /**
     * Retry a failed schedule entry — re-dispatches the job.
     */
    public function retry(Request $request, ScheduleEntry $entry): JsonResponse
    {
        abort_unless($entry->user_id === $request->user()->id, 403);

        if ($entry->status !== 'failed') {
            return response()->json(['message' => 'Only failed entries can be retried.'], 422);
        }

        // Check if social connection still exists and is valid
        $connection = $entry->socialConnection;
        if (!$connection) {
            return response()->json(['message' => 'Social connection no longer exists. Please reconnect your account.'], 422);
        }
        if ($connection->isExpired()) {
            return response()->json(['message' => 'Access token has expired. Please reconnect your account.'], 422);
        }

        // Reset and re-dispatch
        $entry->update([
            'status' => 'pending',
            'failure_reason' => null,
            'retry_count' => 0,
            'published_at' => null,
        ]);

        PublishToSocialJob::dispatch($entry->fresh());

        ActivityLog::log(
            $request->user(),
            'schedule_retried',
            "Retrying failed {$entry->platform} post."
        );

        return response()->json([
            'message' => 'Retrying post. The job has been re-queued.',
        ]);
    }
}
