<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTagRequest;
use App\Http\Requests\UpdateTagRequest;
use App\Http\Resources\TagResource;
use App\Models\Tag;
use Illuminate\Http\JsonResponse;

class TagController extends Controller
{
    public function index(): JsonResponse
    {
        $tags = Tag::withCount('posts')
            ->orderBy('name')
            ->get();

        return response()->json([
            'tags' => TagResource::collection($tags),
        ]);
    }

    public function store(StoreTagRequest $request): JsonResponse
    {
        $tag = Tag::create($request->validated());

        return response()->json([
            'message' => 'Tag created successfully.',
            'tag' => new TagResource($tag),
        ], 201);
    }

    public function show(Tag $tag): JsonResponse
    {
        $tag->loadCount('posts');

        return response()->json([
            'tag' => new TagResource($tag),
        ]);
    }

    public function update(UpdateTagRequest $request, Tag $tag): JsonResponse
    {
        $tag->update($request->validated());

        return response()->json([
            'message' => 'Tag updated successfully.',
            'tag' => new TagResource($tag->fresh()),
        ]);
    }

    public function destroy(Tag $tag): JsonResponse
    {
        $tag->delete();

        return response()->json([
            'message' => 'Tag deleted successfully.',
        ]);
    }
}
