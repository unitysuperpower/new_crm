import { Link, usePage } from '@inertiajs/react';
import { Palette, ShieldCheck, UserRound, UsersRound } from 'lucide-react';
import type { PropsWithChildren } from 'react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn, toUrl } from '@/lib/utils';
import { edit as editAppearance } from '@/routes/appearance';
import { edit } from '@/routes/profile';
import { edit as editSecurity } from '@/routes/security';
import type { NavItem } from '@/types';

export default function SettingsLayout({ children }: PropsWithChildren) {
    const { isCurrentOrParentUrl } = useCurrentUrl();
    const { auth } = usePage().props;
    const permissions = auth.user?.permissions ?? [];
    const canManageUsers = permissions.includes('users:manage');

    const sidebarNavItems: NavItem[] = [
        {
            title: 'Profile',
            href: edit(),
            icon: UserRound,
        },
        {
            title: 'Security',
            href: editSecurity(),
            icon: ShieldCheck,
        },
        canManageUsers && {
            title: 'Users',
            href: '/settings/users',
            icon: UsersRound,
        },
        {
            title: 'Appearance',
            href: editAppearance(),
            icon: Palette,
        },
    ].filter(Boolean) as NavItem[];

    return (
        <div className="crm-page">
            <Heading
                title="Settings"
                description="Manage your profile and account settings"
            />

            <div className="flex flex-col gap-6 lg:flex-row">
                <aside className="w-full lg:w-56 lg:shrink-0">
                    <nav
                        className="crm-panel flex flex-col gap-1 p-2"
                        aria-label="Settings"
                    >
                        {sidebarNavItems.map((item, index) => (
                            <Button
                                key={`${toUrl(item.href)}-${index}`}
                                size="sm"
                                variant="ghost"
                                asChild
                                className={cn('w-full justify-start', {
                                    'bg-primary/10 text-primary':
                                        isCurrentOrParentUrl(item.href),
                                })}
                            >
                                <Link href={item.href}>
                                    {item.icon && (
                                        <item.icon className="h-4 w-4" />
                                    )}
                                    {item.title}
                                </Link>
                            </Button>
                        ))}
                    </nav>
                </aside>

                <Separator className="my-6 lg:hidden" />

                <div className="min-w-0 flex-1">
                    <section className="crm-panel max-w-3xl space-y-10 p-5 md:p-6">
                        {children}
                    </section>
                </div>
            </div>
        </div>
    );
}
