<?php

namespace App\Models;

use Database\Factories\InquiryFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Inquiry extends Model
{
    /** @use HasFactory<InquiryFactory> */
    use HasFactory;

    protected $fillable = [
        'name',
        'phone',
        'email',
        'city',
        'address',
        'source',
        'program_id',
        'previous_program',
        'status',
        'assigned_user_id',
        'department',
        'next_follow_up_at',
        'message',
    ];

    protected function casts(): array
    {
        return [
            'next_follow_up_at' => 'date:Y-m-d',
        ];
    }

    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class);
    }

    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_user_id');
    }

    public function streams(): HasMany
    {
        return $this->hasMany(Stream::class)->latest();
    }
}
