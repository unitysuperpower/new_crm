import { Link, usePage } from '@inertiajs/react';
import { BookOpen, ClipboardList, FolderGit2, GraduationCap, LayoutGrid } from 'lucide-react';
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
import type { NavItem } from '@/types';

export function AppSidebar() {
    const dashboardUrl = '/dashboard';
    const { auth } = usePage().props;
    const permissions = auth.user?.permissions ?? [];
    const canViewInquiries = permissions.includes('inquiry:view');
    const canManagePrograms = permissions.includes('program:manage');
    const canManageCampuses = permissions.includes('campus:manage');

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
    ].filter(Boolean) as NavItem[];

    const footerNavItems: NavItem[] = [
        {
            title: 'Repository',
            href: 'https://github.com/laravel/react-starter-kit',
            icon: FolderGit2,
        },
        {
            title: 'Documentation',
            href: 'https://laravel.com/docs/starter-kits#react',
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
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
