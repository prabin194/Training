<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePostRequest;
use App\Http\Requests\UpdatePostRequest;
use App\Http\Resources\PostResource;
use App\Models\Post;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PostController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Post::with(['author', 'categories', 'tags', 'featuredImage'])
            ->orderBy('created_at', 'desc');

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filter by author
        if ($request->filled('author_id')) {
            $query->where('user_id', $request->author_id);
        }

        // Filter by category
        if ($request->filled('category_id')) {
            $query->whereHas('categories', function ($q) use ($request) {
                $q->where('categories.id', $request->category_id);
            });
        }

        // Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('excerpt', 'like', "%{$search}%");
            });
        }

        $posts = $query->paginate($request->per_page ?? 15);

        return response()->json($posts);
    }

    public function store(StorePostRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['user_id'] = $request->user()->id;
        $data['slug'] = Str::slug($data['title']);

        // Ensure unique slug
        $baseSlug = $data['slug'];
        $counter = 1;
        while (Post::where('slug', $data['slug'])->exists()) {
            $data['slug'] = $baseSlug . '-' . $counter++;
        }

        $post = Post::create($data);

        // Sync categories and tags
        if ($request->filled('category_ids')) {
            $post->categories()->sync($request->category_ids);
        }
        if ($request->filled('tag_ids')) {
            $post->tags()->sync($request->tag_ids);
        }

        $post->load(['author', 'categories', 'tags', 'featuredImage']);

        return response()->json([
            'message' => 'Post created successfully.',
            'post' => new PostResource($post),
        ], 201);
    }

    public function show(Post $post): JsonResponse
    {
        $post->load(['author', 'categories', 'tags', 'featuredImage']);

        return response()->json([
            'post' => new PostResource($post),
        ]);
    }

    public function update(UpdatePostRequest $request, Post $post): JsonResponse
    {
        $data = $request->validated();

        // Regenerate slug if title changed
        if (isset($data['title']) && $data['title'] !== $post->title) {
            $slug = Str::slug($data['title']);
            $baseSlug = $slug;
            $counter = 1;
            while (Post::where('slug', $slug)->where('id', '!=', $post->id)->exists()) {
                $slug = $baseSlug . '-' . $counter++;
            }
            $data['slug'] = $slug;
        }

        $post->update($data);

        // Sync categories and tags
        if ($request->has('category_ids')) {
            $post->categories()->sync($request->category_ids ?? []);
        }
        if ($request->has('tag_ids')) {
            $post->tags()->sync($request->tag_ids ?? []);
        }

        $post->fresh()->load(['author', 'categories', 'tags', 'featuredImage']);

        return response()->json([
            'message' => 'Post updated successfully.',
            'post' => new PostResource($post),
        ]);
    }

    public function destroy(Post $post): JsonResponse
    {
        $post->delete();

        return response()->json([
            'message' => 'Post deleted successfully.',
        ]);
    }
}
