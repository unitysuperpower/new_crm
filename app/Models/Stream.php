<?php

namespace App\Models;

use Database\Factories\StreamFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Stream extends Model
{
    /** @use HasFactory<StreamFactory> */
    use HasFactory;

    protected $fillable = [
        'response',
        'user_id',
        'inquiry_id',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function inquiry(): BelongsTo
    {
        return $this->belongsTo(Inquiry::class);
    }
}
