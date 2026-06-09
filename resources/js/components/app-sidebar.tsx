import { Link, usePage } from '@inertiajs/react';
import { BookOpen, ClipboardList, FolderGit2, GraduationCap, LayoutGrid, Moon, Sun } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useAppearance } from '@/hooks/use-appearance';
import type { NavItem } from '@/types';

export function AppSidebar() {
    const dashboardUrl = '/dashboard';
    const { auth } = usePage().props;
    const permissions = auth.user?.permissions ?? [auth.user?.permissions].flat();
    const canViewInquiries = permissions.includes('inquiry:view');
    const canManagePrograms = permissions.includes('program:manage');
    const canManageCampuses = permissions.includes('campus:manage');
    const canManageUsers = permissions.includes('user:manage');

    const mainNavItems: NavItem[] = [
        canViewInquiries && {
            title: 'Dashboard',
            href: dashboardUrl,
            icon: LayoutGrid,
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
            icon: FolderGit2,
        },
        canManageUsers && {
            title: 'Users',
            href: '/users',
            icon: FolderGit2,
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
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboardUrl} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <SidebarThemeToggle />
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
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
