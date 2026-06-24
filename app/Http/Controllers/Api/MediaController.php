<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\MediaResource;
use App\Models\Media;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MediaController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Media::where('user_id', $request->user()->id)
            ->orderBy('created_at', 'desc');

        if ($request->filled('mime_type')) {
            $query->where('mime_type', 'like', $request->mime_type . '%');
        }

        $media = $query->paginate($request->per_page ?? 20);

        return response()->json($media);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:jpg,jpeg,png,gif,webp,svg,bmp', 'max:10240'],
            'alt_text' => ['nullable', 'string', 'max:500'],
        ]);

        $file = $request->file('file');
        $fileName = Str::random(40) . '.' . $file->getClientOriginalExtension();
        $path = $file->storeAs('media/' . $request->user()->id, $fileName, 'public');

        $media = Media::create([
            'user_id' => $request->user()->id,
            'name' => $file->getClientOriginalName(),
            'file_name' => $fileName,
            'mime_type' => $file->getMimeType(),
            'size' => $file->getSize(),
            'path' => $path,
            'url' => Storage::disk('public')->url($path),
            'alt_text' => $request->alt_text,
        ]);

        return response()->json([
            'message' => 'File uploaded successfully.',
            'media' => new MediaResource($media),
        ], 201);
    }

    public function show(Media $media): JsonResponse
    {
        abort_unless($media->user_id === request()->user()->id, 403);

        return response()->json([
            'media' => new MediaResource($media),
        ]);
    }

    public function update(Request $request, Media $media): JsonResponse
    {
        abort_unless($media->user_id === $request->user()->id, 403);

        $request->validate([
            'alt_text' => ['nullable', 'string', 'max:500'],
        ]);

        $media->update([
            'alt_text' => $request->alt_text,
        ]);

        return response()->json([
            'message' => 'Media updated successfully.',
            'media' => new MediaResource($media),
        ]);
    }

    public function destroy(Media $media): JsonResponse
    {
        abort_unless($media->user_id === request()->user()->id, 403);

        Storage::disk('public')->delete($media->path);
        if ($media->thumbnail_path) {
            Storage::disk('public')->delete($media->thumbnail_path);
        }

        $media->delete();

        return response()->json([
            'message' => 'Media deleted successfully.',
        ]);
    }
}
