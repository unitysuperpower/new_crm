import { Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import {
    BookOpen,
    Building2,
    ClipboardList,
    GraduationCap,
    LayoutDashboard,
    Moon,
    Sun,
    UsersRound,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Switch } from '@/components/ui/switch';
import { useAppearance } from '@/hooks/use-appearance';
import type { NavItem } from '@/types';

export function AppSidebar() {
    const dashboardUrl = '/dashboard';
    const { auth, campusVisibility } = usePage().props;
    const permissions = auth.user?.permissions ?? [];
    const canViewInquiries = permissions.includes('inquiry:view');
    const canManagePrograms = permissions.includes('program:manage');
    const canManageCampuses = permissions.includes('campus:manage');
    const canManageUsers = permissions.includes('users:manage');

    const mainNavItems: NavItem[] = [
        canViewInquiries && {
            title: 'Dashboard',
            href: dashboardUrl,
            icon: LayoutDashboard,
        },
        canViewInquiries && {
            title: 'Inquiries',
            href: '/inquiries',
            icon: ClipboardList,
        },
        canManagePrograms && {
            title: 'Programs',
            href: '/programs',
            icon: GraduationCap,
        },
        canManageCampuses && {
            title: 'Campuses',
            href: '/campuses',
            icon: Building2,
        },
        canManageUsers && {
            title: 'Users',
            href: '/settings/users',
            icon: UsersRound,
        },
    ].filter(Boolean) as NavItem[];

    const footerNavItems: NavItem[] = [
        {
            title: 'Project Docs',
            href: '/documentation',
            icon: BookOpen,
        },
    ];

    return (
        <Sidebar
            collapsible="icon"
            variant="inset"
            className="border-r border-sidebar-border"
        >
            <SidebarHeader className="border-b border-sidebar-border/70 py-3">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboardUrl} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
                {canManageCampuses && (
                    <CampusVisibility campuses={campusVisibility} />
                )}
            </SidebarHeader>

            <SidebarContent className="py-3">
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter className="border-t border-sidebar-border/70 py-3">
                <SidebarThemeToggle />
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}

function CampusVisibility({
    campuses,
}: {
    campuses: Array<{ id: number; name: string; is_active: boolean }>;
}) {
    const [pendingIds, setPendingIds] = useState<number[]>([]);

    const updateCampus = (
        campus: { id: number; name: string; is_active: boolean },
        isActive: boolean,
    ) => {
        setPendingIds((current) => [...new Set([...current, campus.id])]);

        router.patch(
            `/campuses/${campus.id}/toggle`,
            { is_active: isActive },
            {
                preserveScroll: true,
                preserveState: true,
                onFinish: () =>
                    setPendingIds((current) =>
                        current.filter((id) => id !== campus.id),
                    ),
            },
        );
    };

    return (
        <SidebarGroup className="px-0 pb-0 group-data-[collapsible=icon]:hidden">
            <SidebarGroupLabel className="h-7 px-2 text-[11px] font-semibold tracking-wide uppercase">
                <Building2 />
                Campus visibility
            </SidebarGroupLabel>
            <SidebarGroupContent>
                <div className="max-h-44 space-y-0.5 overflow-y-auto rounded-md border border-sidebar-border/70 bg-sidebar-accent/25 p-1">
                    {campuses.map((campus) => {
                        const pending = pendingIds.includes(campus.id);

                        return (
                            <div
                                key={campus.id}
                                className="flex min-h-9 items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-sidebar-accent"
                            >
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-xs font-medium">
                                        {campus.name}
                                    </p>
                                    <p className="text-[10px] text-sidebar-foreground/55">
                                        {pending
                                            ? 'Updating...'
                                            : campus.is_active
                                              ? 'On'
                                              : 'Off'}
                                    </p>
                                </div>
                                <Switch
                                    checked={campus.is_active}
                                    disabled={pending}
                                    aria-label={`${campus.is_active ? 'Hide' : 'Show'} ${campus.name} inquiries`}
                                    onCheckedChange={(checked) =>
                                        updateCampus(campus, checked)
                                    }
                                />
                            </div>
                        );
                    })}
                    {campuses.length === 0 && (
                        <p className="px-2 py-3 text-xs text-sidebar-foreground/55">
                            No campuses available.
                        </p>
                    )}
                </div>
            </SidebarGroupContent>
        </SidebarGroup>
    );
}

function SidebarThemeToggle() {
    const { resolvedAppearance, updateAppearance } = useAppearance();
    const nextAppearance = resolvedAppearance === 'dark' ? 'light' : 'dark';
    const label = resolvedAppearance === 'dark' ? 'Light mode' : 'Dark mode';

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton
                    type="button"
                    tooltip={{ children: label }}
                    onClick={() => updateAppearance(nextAppearance)}
                >
                    {resolvedAppearance === 'dark' ? <Sun /> : <Moon />}
                    <span>{label}</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
