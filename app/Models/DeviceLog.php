<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DeviceLog extends Model
{

    protected $guarded = ['id'];

    protected $fillable = [
        'user_id',
        'device_name',
        'device_type',
        'ip_address',
        'user_agent',
        'last_activity_at',
    ];


    protected $casts = [
        'last_activity_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
