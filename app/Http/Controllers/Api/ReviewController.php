<?php

namespace App\Http\Controllers\Api;

use App\Actions\PostWorkflowAction;
use App\Enums\PostStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\PostResource;
use App\Models\Post;
use App\Models\PostStatusTransition;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    public function __construct(
        private PostWorkflowAction $workflow,
    ) {}

    /**
     * Submit post for review (draft -> in_review)
     */
    public function submitForReview(Request $request, Post $post): JsonResponse
    {
        try {
            $post = $this->workflow->transition(
                $post,
                PostStatus::InReview,
                $request->user(),
                $request->input('comment')
            );

            return response()->json([
                'message' => 'Post submitted for review.',
                'post' => new PostResource($post->load(['author', 'categories', 'tags', 'featuredImage'])),
            ]);
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    /**
     * Approve a post (in_review -> approved)
     */
    public function approve(Request $request, Post $post): JsonResponse
    {
        $request->validate(['comment' => 'nullable|string|max:1000']);

        try {
            $post = $this->workflow->transition(
                $post,
                PostStatus::Approved,
                $request->user(),
                $request->input('comment')
            );

            return response()->json([
                'message' => 'Post approved.',
                'post' => new PostResource($post->load(['author', 'categories', 'tags', 'featuredImage'])),
            ]);
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    /**
     * Reject a post (in_review -> rejected) with comment
     */
    public function reject(Request $request, Post $post): JsonResponse
    {
        $request->validate([
            'comment' => 'required|string|max:1000',
        ]);

        try {
            $post = $this->workflow->transition(
                $post,
                PostStatus::Rejected,
                $request->user(),
                $request->input('comment')
            );

            return response()->json([
                'message' => 'Post rejected.',
                'post' => new PostResource($post->load(['author', 'categories', 'tags', 'featuredImage'])),
            ]);
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    /**
     * Publish a post (approved -> published)
     */
    public function publish(Request $request, Post $post): JsonResponse
    {
        try {
            $post = $this->workflow->transition(
                $post,
                PostStatus::Published,
                $request->user(),
                $request->input('comment')
            );

            return response()->json([
                'message' => 'Post published.',
                'post' => new PostResource($post->load(['author', 'categories', 'tags', 'featuredImage'])),
            ]);
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    /**
     * View pending reviews (in_review posts for editors/admins)
     */
    public function pendingReviews(Request $request): JsonResponse
    {
        $posts = Post::with(['author', 'categories', 'tags'])
            ->where('status', PostStatus::InReview)
            ->orderBy('updated_at', 'asc')
            ->paginate($request->per_page ?? 20);

        return response()->json($posts);
    }

    /**
     * Get transition history for a post
     */
    public function transitions(Post $post): JsonResponse
    {
        $transitions = PostStatusTransition::with('user')
            ->where('post_id', $post->id)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn ($t) => [
                'id' => $t->id,
                'from_status' => $t->from_status,
                'to_status' => $t->to_status,
                'comment' => $t->comment,
                'user_name' => $t->user?->name,
                'created_at' => $t->created_at->toISOString(),
            ]);

        return response()->json(['transitions' => $transitions]);
    }

    /**
     * Get allowed transitions for the current user on this post
     */
    public function allowedTransitions(Request $request, Post $post): JsonResponse
    {
        $transitions = $this->workflow->getAllowedTransitions($post, $request->user());

        return response()->json(['allowed_transitions' => $transitions]);
    }
}
