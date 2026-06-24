<?php

namespace App\Actions;

use App\Enums\PostStatus;
use App\Enums\UserRole;
use App\Models\ActivityLog;
use App\Models\Post;
use App\Models\PostStatusTransition;
use App\Models\User;
use RuntimeException;

class PostWorkflowAction
{
    /**
     * Allowed transitions and the roles that can perform them:
     * [from_status => [to_status => [allowed_roles]]]
     */
    private const TRANSITIONS = [
        'draft' => [
            'in_review' => [UserRole::Author, UserRole::Editor, UserRole::Admin],
        ],
        'in_review' => [
            'approved' => [UserRole::Editor, UserRole::Admin],
            'rejected' => [UserRole::Editor, UserRole::Admin],
        ],
        'approved' => [
            'published' => [UserRole::Editor, UserRole::Admin],
            'scheduled' => [UserRole::Editor, UserRole::Admin],
        ],
        'rejected' => [
            'draft' => [UserRole::Author, UserRole::Editor, UserRole::Admin],
        ],
        'scheduled' => [
            'published' => [UserRole::Admin], // manual override
            'draft' => [UserRole::Editor, UserRole::Admin],
        ],
        'published' => [
            'draft' => [UserRole::Editor, UserRole::Admin], // unpublish
            'archived' => [UserRole::Editor, UserRole::Admin],
        ],
        'archived' => [
            'draft' => [UserRole::Admin],
        ],
    ];

    public function transition(Post $post, PostStatus $toStatus, User $actor, ?string $comment = null): Post
    {
        $fromStatus = $post->status;

        if (!$fromStatus) {
            throw new RuntimeException('Post has no current status.');
        }

        // Check if the transition is valid
        $allowedTransitions = self::TRANSITIONS[$fromStatus->value] ?? null;
        if (!$allowedTransitions || !isset($allowedTransitions[$toStatus->value])) {
            throw new RuntimeException(
                "Cannot transition from '{$fromStatus->value}' to '{$toStatus->value}'."
            );
        }

        // Check if the actor has the required role
        $allowedRoles = $allowedTransitions[$toStatus->value];
        $actorRole = UserRole::tryFrom($actor->role);

        if (!$actorRole || !in_array($actorRole, $allowedRoles)) {
            throw new RuntimeException(
                "You do not have permission to perform this transition."
            );
        }

        // Author can only submit their own posts for review
        if ($fromStatus->value === 'draft' && $toStatus->value === 'in_review' && $actorRole === UserRole::Author) {
            if ($post->user_id !== $actor->id) {
                throw new RuntimeException('You can only submit your own posts for review.');
            }
        }

        // Editors can only act on posts that are in_review (not their own draft)
        if ($fromStatus->value === 'in_review' && $actorRole !== UserRole::Admin && $post->user_id === $actor->id) {
            throw new RuntimeException('You cannot review your own post.');
        }

        // Record the transition
        PostStatusTransition::create([
            'post_id' => $post->id,
            'user_id' => $actor->id,
            'from_status' => $fromStatus->value,
            'to_status' => $toStatus->value,
            'comment' => $comment,
        ]);

        // Update the post status
        $post->update([
            'status' => $toStatus->value,
            'published_at' => $toStatus === PostStatus::Published ? now() : $post->published_at,
        ]);

        // Log activity
        ActivityLog::log($actor, 'post_status_changed', "Post '{$post->title}' status changed from '{$fromStatus->value}' to '{$toStatus->value}'." . ($comment ? " Comment: {$comment}" : ''));

        return $post->fresh();
    }

    /**
     * Get allowed next statuses for a post based on the actor's role.
     */
    public function getAllowedTransitions(Post $post, User $actor): array
    {
        $currentStatus = $post->status?->value;
        if (!$currentStatus || !isset(self::TRANSITIONS[$currentStatus])) {
            return [];
        }

        $actorRole = UserRole::tryFrom($actor->role);
        if (!$actorRole) {
            return [];
        }

        $allowed = [];
        foreach (self::TRANSITIONS[$currentStatus] as $toStatus => $roles) {
            if (in_array($actorRole, $roles)) {
                // Author can only submit own posts
                if ($currentStatus === 'draft' && $toStatus === 'in_review' && $actorRole === UserRole::Author) {
                    if ($post->user_id === $actor->id) {
                        $allowed[] = $toStatus;
                    }
                } elseif ($currentStatus === 'in_review' && $actorRole !== UserRole::Admin && $post->user_id === $actor->id) {
                    // Can't review own post
                    continue;
                } else {
                    $allowed[] = $toStatus;
                }
            }
        }

        return $allowed;
    }
}
