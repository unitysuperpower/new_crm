<?php

namespace App\Enums;

enum UserRole: string
{
    case SuperAdmin = 'super_admin';
    case Admin = 'admin';
    case User = 'user';

    public function label(): string
    {
        return match ($this) {
            self::SuperAdmin => 'Super Admin',
            self::Admin => 'Admin',
            self::User => 'User',
        };
    }

    /**
     * @return array<UserPermission>
     */
    public function permissions(): array
    {
        return match ($this) {
            self::SuperAdmin => UserPermission::cases(),
            self::Admin => [
                UserPermission::ViewUsers,
                UserPermission::ViewInquiry,
                UserPermission::CreateInquiry,
                UserPermission::ImportInquiry,
                UserPermission::ManageInquiry,
                UserPermission::UpdateAssignedInquiry,
                UserPermission::CreateInquiryStream,
                UserPermission::ManageProgram,
                UserPermission::ManageCampus,
            ],
            self::User => [
                UserPermission::ViewInquiry,
                UserPermission::CreateInquiry,
                UserPermission::UpdateAssignedInquiry,
                UserPermission::CreateInquiryStream,
            ],
        };
    }

    /**
     * @return array<array{value: string, label: string}>
     */
    public static function options(): array
    {
        return collect(self::cases())
            ->map(fn (self $role) => ['value' => $role->value, 'label' => $role->label()])
            ->values()
            ->toArray();
    }
}
