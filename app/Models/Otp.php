<?php

namespace App\Models;

use App\Enums\OtpType;
use Illuminate\Database\Eloquent\Model;

class Otp extends Model
{
    protected $fillable = [
        'user_id',
        'code',
        'type',
        'expires_at',
        'used_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'used_at' => 'datetime',
        'type' => OtpType::class,
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function isValid(): bool
    {
        return !$this->used_at && $this->expires_at && $this->expires_at->isFuture();
    }
}
