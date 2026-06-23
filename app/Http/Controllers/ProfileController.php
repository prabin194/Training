<?php

namespace App\Http\Controllers;

use App\Actions\ChangePasswordAction;
use App\Http\Requests\ChangePasswordRequest;
use App\Http\Requests\UpdateProfileRequest;
use App\Http\Resources\UserResource;
use App\Models\ActivityLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProfileController extends Controller
{
    public function __construct(
        private ChangePasswordAction $changePassword,
    ) {}

    public function show(Request $request): JsonResponse
    {
        return response()->json([
            'user' => new UserResource($request->user()),
        ]);
    }

    public function update(UpdateProfileRequest $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validated();

        $changes = [];
        foreach ($data as $key => $value) {
            if ($user->$key !== $value) {
                $changes[$key] = $value;
            }
        }

        if (!empty($changes)) {
            $user->update($changes);
            ActivityLog::log($user, 'profile_updated', 'Profile updated.', ['changes' => array_keys($changes)]);
        }

        return response()->json([
            'message' => 'Profile updated successfully.',
            'user' => new UserResource($user->fresh()),
        ]);
    }

    public function changePassword(ChangePasswordRequest $request): JsonResponse
    {
        try {
            $this->changePassword->execute(
                $request->user(),
                $request->current_password,
                $request->new_password
            );

            ActivityLog::log($request->user(), 'password_changed', 'Password changed.');
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }

        return response()->json(['message' => 'Password changed successfully.']);
    }
}
