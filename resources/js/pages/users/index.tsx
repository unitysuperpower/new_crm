import { Head, router } from '@inertiajs/react';
import { Save, ShieldCheck, UsersRound } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

type RoleOption = { value: string; label: string };
type PermissionOption = { value: string; label: string };
type CampusOption = { id: number; name: string; is_active: boolean };
type ManagedUser = {
    id: number;
    name: string;
    email: string;
    role: string;
    role_label: string;
    department: string;
    permissions: string[];
    campus_ids: number[];
};

export default function UsersIndex({
    users,
    roles,
    permissions,
    departments,
    campuses,
}: {
    users: ManagedUser[];
    roles: RoleOption[];
    permissions: PermissionOption[];
    departments: string[];
    campuses: CampusOption[];
}) {
    return (
        <>
            <Head title="Users" />
            <div className="crm-page">
                <div className="crm-page-header">
                    <div>
                        <h1 className="crm-page-title">Users</h1>
                        <p className="crm-page-description">
                            Manage employee roles and fine-grained CRM
                            permissions.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <UsersRound className="size-4" />
                        {users.length} employees
                    </div>
                </div>

                <div className="grid gap-4 xl:grid-cols-2">
                    {users.map((user) => (
                        <UserPermissionRow
                            key={user.id}
                            user={user}
                            roles={roles}
                            permissions={permissions}
                            departments={departments}
                            campuses={campuses}
                        />
                    ))}
                </div>
            </div>
        </>
    );
}

function UserPermissionRow({
    user,
    roles,
    permissions,
    departments,
    campuses,
}: {
    user: ManagedUser;
    roles: RoleOption[];
    permissions: PermissionOption[];
    departments: string[];
    campuses: CampusOption[];
}) {
    const [role, setRole] = useState(user.role);
    const [department, setDepartment] = useState(user.department);
    const [selectedPermissions, setSelectedPermissions] = useState(
        user.permissions,
    );
    const [selectedCampusIds, setSelectedCampusIds] = useState(user.campus_ids);

    const submit = (event: FormEvent) => {
        event.preventDefault();
        router.patch(
            `/settings/users/${user.id}`,
            {
                role,
                department,
                permissions: selectedPermissions,
                campus_ids: selectedCampusIds,
            },
            { preserveScroll: true },
        );
    };

    const togglePermission = (permission: string, checked: boolean) => {
        setSelectedPermissions((current) =>
            checked
                ? [...new Set([...current, permission])]
                : current.filter((item) => item !== permission),
        );
    };

    const toggleCampus = (campusId: number, checked: boolean) => {
        setSelectedCampusIds((current) =>
            checked
                ? [...new Set([...current, campusId])]
                : current.filter((id) => id !== campusId),
        );
    };

    return (
        <form className="crm-panel p-5" onSubmit={submit}>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                            <ShieldCheck className="size-4" />
                        </span>
                        <span className="font-semibold">{user.name}</span>
                        <Badge variant="secondary">{user.role_label}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                        {user.email}
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Select value={role} onValueChange={setRole}>
                        <SelectTrigger className="w-44">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {roles.map((roleOption) => (
                                <SelectItem
                                    key={roleOption.value}
                                    value={roleOption.value}
                                >
                                    {roleOption.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={department} onValueChange={setDepartment}>
                        <SelectTrigger className="w-44 capitalize">
                            <SelectValue placeholder="Department" />
                        </SelectTrigger>
                        <SelectContent>
                            {departments.map((departmentOption) => (
                                <SelectItem
                                    key={departmentOption}
                                    value={departmentOption}
                                    className="capitalize"
                                >
                                    {departmentOption}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button type="submit">
                        <Save />
                        Save
                    </Button>
                </div>
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-2">
                {permissions.map((permission) => (
                    <Label
                        key={permission.value}
                        className="flex cursor-pointer items-center gap-2 rounded-md border bg-muted/20 p-3 transition-colors hover:bg-muted/50"
                    >
                        <Checkbox
                            checked={selectedPermissions.includes(
                                permission.value,
                            )}
                            onCheckedChange={(checked) =>
                                togglePermission(
                                    permission.value,
                                    checked === true,
                                )
                            }
                        />
                        <span>{permission.label}</span>
                    </Label>
                ))}
            </div>

            <div className="mt-5 border-t pt-5">
                <div className="mb-3">
                    <div className="font-medium">Campus access</div>
                    <p className="text-sm text-muted-foreground">
                        {user.role === 'super_admin'
                            ? 'Super Admin has access to every campus.'
                            : 'Select the campuses this employee can access.'}
                    </p>
                </div>
                {user.role !== 'super_admin' && (
                    <div className="grid gap-2 sm:grid-cols-2">
                        {campuses.map((campus) => (
                            <Label
                                key={campus.id}
                                className="flex cursor-pointer items-center gap-2 rounded-md border bg-muted/20 p-3 transition-colors hover:bg-muted/50"
                            >
                                <Checkbox
                                    checked={selectedCampusIds.includes(campus.id)}
                                    onCheckedChange={(checked) =>
                                        toggleCampus(campus.id, checked === true)
                                    }
                                />
                                <span className="flex-1">{campus.name}</span>
                                {!campus.is_active && (
                                    <Badge variant="outline">Hidden</Badge>
                                )}
                            </Label>
                        ))}
                        {campuses.length === 0 && (
                            <p className="text-sm text-muted-foreground">
                                Create a campus before assigning access.
                            </p>
                        )}
                    </div>
                )}
            </div>
        </form>
    );
}

UsersIndex.layout = () => ({
    breadcrumbs: [
        {
            title: 'Users',
            href: '/settings/users',
        },
    ],
});
