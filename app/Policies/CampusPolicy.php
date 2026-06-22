<?php

namespace App\Policies;

use App\Enums\UserPermission;
use App\Models\Campus;
use App\Models\User;

class CampusPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermission(UserPermission::ManageCampus);
    }

    public function view(User $user, Campus $campus): bool
    {
        return $user->hasPermission(UserPermission::ManageCampus);
    }

    public function create(User $user): bool
    {
        return $user->hasPermission(UserPermission::ManageCampus);
    }

    public function update(User $user, Campus $campus): bool
    {
        return $user->hasPermission(UserPermission::ManageCampus);
    }

    public function toggleVisibility(User $user, Campus $campus): bool
    {
        return $user->hasPermission(UserPermission::ToggleCampusVisibility)
            && $user->canAccessCampus($campus->id);
    }

    public function delete(User $user, Campus $campus): bool
    {
        return $user->hasPermission(UserPermission::ManageCampus);
    }

    public function restore(User $user, Campus $campus): bool
    {
        return false;
    }

    public function forceDelete(User $user, Campus $campus): bool
    {
        return false;
    }
}
