<?php

namespace App\Enums;

enum UserPermission: string
{
    case ManageUsers = 'users:manage';
    case ViewUsers = 'users:view';

    case ViewInquiry = 'inquiry:view';
    case CreateInquiry = 'inquiry:create';
    case ImportInquiry = 'inquiry:import';
    case ManageInquiry = 'inquiry:manage';
    case UpdateAssignedInquiry = 'inquiry:update-assigned';
    case CreateInquiryStream = 'inquiry-stream:create';

    case ManageProgram = 'program:manage';
    case ManageCampus = 'campus:manage';

    public function label(): string
    {
        return match ($this) {
            self::ManageUsers => 'Manage users',
            self::ViewUsers => 'View users',
            self::ViewInquiry => 'View inquiries',
            self::CreateInquiry => 'Create inquiries',
            self::ImportInquiry => 'Import inquiries',
            self::ManageInquiry => 'Manage all inquiries',
            self::UpdateAssignedInquiry => 'Update assigned inquiries',
            self::CreateInquiryStream => 'Add inquiry streams',
            self::ManageProgram => 'Manage programs',
            self::ManageCampus => 'Manage campuses',
        };
    }
}
