<?php

namespace App\Policies;

use App\Enums\UserPermission;
use App\Enums\UserRole;
use App\Models\Inquiry;
use App\Models\User;

class InquiryPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasPermission(UserPermission::ViewInquiry);
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Inquiry $inquiry): bool
    {
        return $user->hasPermission(UserPermission::ViewInquiry);
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->hasPermission(UserPermission::CreateInquiry);
    }

    public function import(User $user): bool
    {
        return $user->hasPermission(UserPermission::ImportInquiry);
    }

    public function assign(User $user): bool
    {
        return $user->role === UserRole::SuperAdmin;
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Inquiry $inquiry): bool
    {
        if ($user->hasPermission(UserPermission::ManageInquiry)) {
            return true;
        }

        return (int) $inquiry->assigned_user_id === (int) $user->id
            && $user->hasPermission(UserPermission::UpdateAssignedInquiry);
    }

    public function createStream(User $user, Inquiry $inquiry): bool
    {
        return $user->hasPermission(UserPermission::CreateInquiryStream);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Inquiry $inquiry): bool
    {
        return false;
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Inquiry $inquiry): bool
    {
        return false;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Inquiry $inquiry): bool
    {
        return false;
    }
}
