<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Media extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'file_name',
        'mime_type',
        'size',
        'path',
        'url',
        'thumbnail_path',
        'thumbnail_url',
        'alt_text',
    ];

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
