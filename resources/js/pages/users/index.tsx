import { FormEvent, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { ShieldCheck, Save } from 'lucide-react';

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
type ManagedUser = {
    id: number;
    name: string;
    email: string;
    role: string;
    role_label: string;
    permissions: string[];
};

export default function UsersIndex({
    users,
    roles,
    permissions,
}: {
    users: ManagedUser[];
    roles: RoleOption[];
    permissions: PermissionOption[];
}) {
    return (
        <>
            <Head title="Users" />
            <div className="space-y-4 p-4">
                <div>
                    <h1 className="text-xl font-semibold">Users</h1>
                    <p className="text-muted-foreground text-sm">Manage user roles and permissions.</p>
                </div>

                <div className="space-y-3">
                    {users.map((user) => (
                        <UserPermissionRow key={user.id} user={user} roles={roles} permissions={permissions} />
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
}: {
    user: ManagedUser;
    roles: RoleOption[];
    permissions: PermissionOption[];
}) {
    const [role, setRole] = useState(user.role);
    const [selectedPermissions, setSelectedPermissions] = useState(user.permissions);

    const submit = (event: FormEvent) => {
        event.preventDefault();
        router.patch(
            `/settings/users/${user.id}`,
            { role, permissions: selectedPermissions },
            { preserveScroll: true },
        );
    };

    const togglePermission = (permission: string, checked: boolean) => {
        setSelectedPermissions((current) =>
            checked ? [...new Set([...current, permission])] : current.filter((item) => item !== permission),
        );
    };

    return (
        <form className="rounded-lg border bg-background p-4" onSubmit={submit}>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="text-muted-foreground size-4" />
                        <span className="font-medium">{user.name}</span>
                        <Badge variant="secondary">{user.role_label}</Badge>
                    </div>
                    <div className="text-muted-foreground text-sm">{user.email}</div>
                </div>

                <div className="flex items-center gap-2">
                    <Select value={role} onValueChange={setRole}>
                        <SelectTrigger className="w-44">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {roles.map((roleOption) => (
                                <SelectItem key={roleOption.value} value={roleOption.value}>
                                    {roleOption.label}
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

            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {permissions.map((permission) => (
                    <Label key={permission.value} className="flex items-center gap-2 rounded-md border p-3">
                        <Checkbox
                            checked={selectedPermissions.includes(permission.value)}
                            onCheckedChange={(checked) => togglePermission(permission.value, checked === true)}
                        />
                        <span>{permission.label}</span>
                    </Label>
                ))}
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
