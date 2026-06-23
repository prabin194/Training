<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LoginLog extends Model
{
    protected $fillable = [
        'user_id',
        'ip_address',
        'user_agent',
        'login_at',
        'login_successful',
        'failure_reason',
    ];

    protected $casts = [
        'login_at' => 'datetime',
        'login_successful' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
