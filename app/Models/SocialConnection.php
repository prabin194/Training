<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SocialConnection extends Model
{
    protected $fillable = [
        'user_id',
        'provider',
        'provider_account_id',
        'name',
        'access_token',
        'refresh_token',
        'token_expires_at',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'access_token' => 'encrypted',
            'refresh_token' => 'encrypted',
            'token_expires_at' => 'datetime',
            'metadata' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function isExpired(): bool
    {
        return $this->token_expires_at && $this->token_expires_at->isPast();
    }

    public function isFacebook(): bool
    {
        return $this->provider === 'facebook_page';
    }

    public function isInstagram(): bool
    {
        return $this->provider === 'instagram_business';
    }

    public function scheduleEntries(): HasMany
    {
        return $this->hasMany(ScheduleEntry::class);
    }
}
