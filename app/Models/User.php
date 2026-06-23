<?php

namespace App\Models;

use App\Enums\OnboardingStatus;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
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
        'password',
        'email_verified_at',
        'onboarding_status',
    ];

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

    public function otps()
    {
        return $this->hasMany(Otp::class);
    }

    public function loginLogs()
    {
        return $this->hasMany(LoginLog::class);
    }

    public function deviceLogs()
    {
        return $this->hasMany(DeviceLog::class);
    }

    public function activityLogs()
    {
        return $this->hasMany(ActivityLog::class);
    }
}
