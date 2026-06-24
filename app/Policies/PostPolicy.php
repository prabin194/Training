<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Post;
use App\Models\User;

class PostPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Post $post): bool
    {
        // Author can view their own posts; editors/admins can view all
        return $user->id === $post->user_id || in_array($user->role, [UserRole::Editor->value, UserRole::Admin->value]);
    }

    public function create(User $user): bool
    {
        return in_array($user->role, [UserRole::Author->value, UserRole::Editor->value, UserRole::Admin->value]);
    }

    public function update(User $user, Post $post): bool
    {
        // Author can update their own drafts/rejected posts
        if ($user->id === $post->user_id) {
            return in_array($post->status?->value, ['draft', 'rejected']);
        }

        // Editors and admins can update any post
        return in_array($user->role, [UserRole::Editor->value, UserRole::Admin->value]);
    }

    public function delete(User $user, Post $post): bool
    {
        // Author can delete their own draft/rejected posts
        if ($user->id === $post->user_id) {
            return in_array($post->status?->value, ['draft', 'rejected']);
        }

        // Admins can delete any post
        return $user->role === UserRole::Admin->value;
    }

    public function restore(User $user, Post $post): bool
    {
        return $user->role === UserRole::Admin->value;
    }

    public function forceDelete(User $user, Post $post): bool
    {
        return $user->role === UserRole::Admin->value;
    }
}
