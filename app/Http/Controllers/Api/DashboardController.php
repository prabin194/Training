<?php

namespace App\Http\Controllers\Api;

use App\Enums\PostStatus;
use App\Http\Controllers\Controller;
use App\Models\Post;
use App\Models\Category;
use App\Models\Tag;
use App\Models\Media;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function stats(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'stats' => [
                'total_posts' => Post::where('user_id', $user->id)->count(),
                'published_posts' => Post::where('user_id', $user->id)
                    ->where('status', PostStatus::Published)
                    ->count(),
                'draft_posts' => Post::where('user_id', $user->id)
                    ->where('status', PostStatus::Draft)
                    ->count(),
                'in_review_posts' => Post::where('user_id', $user->id)
                    ->where('status', PostStatus::InReview)
                    ->count(),
                'categories_count' => Category::count(),
                'tags_count' => Tag::count(),
                'media_count' => Media::where('user_id', $user->id)->count(),
                'recent_posts' => Post::where('user_id', $user->id)
                    ->orderBy('created_at', 'desc')
                    ->take(5)
                    ->get()
                    ->map(fn ($post) => [
                        'id' => $post->id,
                        'title' => $post->title,
                        'status' => $post->status?->value,
                        'created_at' => $post->created_at->toISOString(),
                    ]),
            ],
        ]);
    }
}
