<?php

namespace App\Models;

use App\Enums\OnboardingStatus;
use App\Enums\UserRole;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Str;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'uid',
        'name',
        'email',
        'mobile_no',
        'role',
        'password',
        'email_verified_at',
        'onboarding_status',
    ];

    public function isAdmin(): bool
    {
        return $this->role === UserRole::Admin->value;
    }

    public function isEditor(): bool
    {
        return $this->role === UserRole::Editor->value;
    }

    public function isAuthor(): bool
    {
        return $this->role === UserRole::Author->value;
    }

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'onboarding_status' => OnboardingStatus::class,
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (User $user) {
            $user->uid = (string) Str::uuid();
        });
    }

    public function otps(): HasMany
    {
        return $this->hasMany(Otp::class);
    }

    public function loginLogs(): HasMany
    {
        return $this->hasMany(LoginLog::class);
    }

    public function deviceLogs(): HasMany
    {
        return $this->hasMany(DeviceLog::class);
    }

    public function activityLogs(): HasMany
    {
        return $this->hasMany(ActivityLog::class);
    }

    public function posts(): HasMany
    {
        return $this->hasMany(Post::class, 'user_id');
    }

    public function media(): HasMany
    {
        return $this->hasMany(Media::class);
    }
}
