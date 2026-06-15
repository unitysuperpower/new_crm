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
        'campus',
        'campus_id',
        'status',
        'assigned_user_id',
        'assigned_at',
        'department',
        'postal_communication',
        'next_follow_up_at',
        'last_activity_at',
        'message',
    ];

    protected function casts(): array
    {
        return [
            'next_follow_up_at' => 'date:Y-m-d',
            'assigned_at' => 'datetime',
            'last_activity_at' => 'datetime',
        ];
    }

    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class);
    }

    public function campusModel(): BelongsTo
    {
        return $this->belongsTo(Campus::class, 'campus_id');
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
