<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ScheduleEntry extends Model
{
    protected $fillable = [
        'user_id',
        'post_id',
        'social_connection_id',
        'platform',
        'content',
        'image_url',
        'scheduled_at',
        'status',
        'failure_reason',
        'retry_count',
        'published_at',
    ];

    protected function casts(): array
    {
        return [
            'scheduled_at' => 'datetime',
            'published_at' => 'datetime',
            'retry_count' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function post(): BelongsTo
    {
        return $this->belongsTo(Post::class);
    }

    public function socialConnection(): BelongsTo
    {
        return $this->belongsTo(SocialConnection::class);
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending')
            ->where('scheduled_at', '<=', now());
    }

    public function scopeScheduled($query)
    {
        return $query->where('status', 'pending')
            ->where('scheduled_at', '>', now());
    }

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isDue(): bool
    {
        return $this->isPending() && $this->scheduled_at->isPast();
    }
}
