<?php

namespace App\Models;

use App\Enums\UserPermission;
use App\Enums\UserRole;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\Contracts\PasskeyUser;
use Laravel\Fortify\PasskeyAuthenticatable;
use Laravel\Fortify\TwoFactorAuthenticatable;

// user model with the following fields:

// 1. Full Name:
// 2. Father's Name:
// 3. CNIC No.:
// 4. Date of Birth:
// 5. Gender:
// 6. Religion:
// 7. Blood Group:
// 8. Marital Status:
// 9. Nationality:
// 10. Domicile:
// 11. Personal Email:
// 12. Official Email:
// 13. Mobile No.:
// 14. Current City of Residence:
// 15. Emergency Contact Details:
//     · Name:
//     · Relationship:
//     · Contact Number:

#[Fillable([
    'name',
    'father_name',
    'cnic_no',
    'date_of_birth',
    'gender',
    'religion',
    'blood_group',
    'marital_status',
    'nationality',
    'domicile',
    'email',
    'personal_email',
    'official_email',
    'mobile_no',
    'current_city',
    'emergency_contact_name',
    'emergency_contact_relationship',
    'emergency_contact_number',
    'password',
    'role',
    'department',
    'permissions',
])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]
class User extends Authenticatable implements PasskeyUser
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, PasskeyAuthenticatable, TwoFactorAuthenticatable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'date_of_birth' => 'date',
            'password' => 'hashed',
            'permissions' => 'array',
            'role' => UserRole::class,
            'two_factor_confirmed_at' => 'datetime',
        ];
    }

    public function hasPermission(UserPermission $permission): bool
    {
        if ($this->role === UserRole::SuperAdmin) {
            return true;
        }

        $permissions = $this->permissions ?: collect($this->role?->permissions() ?? [])
            ->map(fn (UserPermission $permission) => $permission->value)
            ->all();

        return in_array($permission->value, $permissions, true);
    }

    public function permissionValues(): array
    {
        if ($this->role === UserRole::SuperAdmin) {
            return collect(UserPermission::cases())->map->value->all();
        }

        return $this->permissions ?: collect($this->role?->permissions() ?? [])->map->value->all();
    }

    // relationships with inquiries and streams
    public function inquiries()
    {
        return $this->hasMany(Inquiry::class, 'assigned_user_id');
    }

    public function streams()
    {
        return $this->hasMany(Stream::class, 'user_id');
    }

    public function campuses(): BelongsToMany
    {
        return $this->belongsToMany(Campus::class)->withTimestamps();
    }

    public function canAccessCampus(?int $campusId): bool
    {
        if ($this->role === UserRole::SuperAdmin) {
            return true;
        }

        if (! $campusId) {
            // Older inquiries without a campus remain visible until they are classified.
            return true;
        }

        if ($this->relationLoaded('campuses')) {
            return $this->campuses->contains('id', $campusId);
        }

        return $this->campuses()->whereKey($campusId)->exists();
    }
}
