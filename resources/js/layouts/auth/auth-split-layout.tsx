import { Link, usePage } from '@inertiajs/react';
import { GraduationCap, ShieldCheck } from 'lucide-react';
import type { ComponentProps } from 'react';
import { home } from '@/routes';
import { login, register } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSplitLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    const { url } = usePage();
    const activeTab = url.startsWith('/register') ? 'register' : 'login';
    const showTabs = url.startsWith('/login') || url.startsWith('/register');

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#f7f4ef] p-6 text-[#1f2520] lg:p-8 dark:bg-[#0b0f0d] dark:text-[#f5f1e8]">
            <main className="grid w-full max-w-5xl overflow-hidden rounded-lg border border-[#ded7c9] bg-white shadow-sm lg:grid-cols-[1.05fr_0.95fr] dark:border-[#26312b] dark:bg-[#111714]">
                <section className="flex flex-col justify-between gap-10 p-6 sm:p-10 lg:p-14">
                    <div className="space-y-8">
                        <Link href={home()} className="flex items-center gap-3">
                            <div className="flex size-14 items-center justify-center overflow-hidden rounded-md border border-[#e1d7c6] bg-[#fbf8f1] dark:border-[#2d3a32] dark:bg-[#17201b]">
                                <img src="/logo.jpeg" alt="Aurea Education logo" className="size-full object-contain p-1" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-[#6d745f] dark:text-[#aab49f]">Advanced CRM</p>
                                <h1 className="text-2xl font-semibold tracking-normal">Aurea Education</h1>
                            </div>
                        </Link>

                        <div className="max-w-xl space-y-4">
                            <h2 className="text-4xl font-semibold tracking-normal text-balance sm:text-5xl">
                                Manage student inquiries with clarity.
                            </h2>
                            <p className="text-base leading-7 text-[#6c6d66] dark:text-[#b7b7ad]">
                                Sign in to manage employees, inquiries, streams, programs, campuses, assignments, and
                                follow-up history in one place.
                            </p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3">
                            <Stat value="360" label="Inquiry view" />
                            <Stat value="Roles" label="Access control" />
                            <Stat value="CSV" label="Bulk import" />
                        </div>
                    </div>

                    <div className="rounded-md border border-[#e1d7c6] bg-[#fbf8f1] p-4 dark:border-[#2d3a32] dark:bg-[#17201b]">
                        <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                            <ShieldCheck className="size-4 text-[#6f835a] dark:text-[#b6c9a8]" />
                            Secure workspace for admissions and campus teams.
                        </div>
                        <p className="text-sm leading-6 text-[#70746b] dark:text-[#aeb4a8]">
                            Super Admins control permissions. Employees work only inside the access assigned to them.
                        </p>
                    </div>
                </section>

                <section className="relative overflow-hidden border-t border-[#ded7c9] bg-[#eef3ee] p-6 sm:p-10 lg:border-t-0 lg:border-l dark:border-[#26312b] dark:bg-[#121c17]">
                    <div className="absolute inset-x-0 top-0 h-1 bg-[#7b8f64]" />
                    <div className="flex min-h-full items-center">
                        <div className="w-full rounded-md border border-[#d7dfd2] bg-white/90 p-5 shadow-sm sm:p-6 dark:border-[#28382f] dark:bg-[#17211c]">
                            {showTabs && (
                                <div className="mb-6 grid grid-cols-2 rounded-md border border-[#e1d7c6] bg-[#fbf8f1] p-1 dark:border-[#2d3a32] dark:bg-[#111714]">
                                    <AuthTab href={login()} active={activeTab === 'login'}>
                                        Login
                                    </AuthTab>
                                    <AuthTab href={register()} active={activeTab === 'register'}>
                                        Register
                                    </AuthTab>
                                </div>
                            )}

                            <div className="mb-6 space-y-2">
                                <div className="inline-flex items-center gap-2 rounded-md border border-[#cbd8c6] bg-[#f8fbf5] px-3 py-2 text-sm font-medium text-[#4f6244] dark:border-[#314235] dark:bg-[#19241e] dark:text-[#b8c8af]">
                                    <GraduationCap className="size-4" />
                                    Education operations suite
                                </div>
                                <h1 className="pt-2 text-xl font-semibold">{title}</h1>
                                <p className="text-sm leading-6 text-muted-foreground">{description}</p>
                            </div>

                            {children}
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}

function AuthTab({
    href,
    active,
    children,
}: {
    href: ComponentProps<typeof Link>['href'];
    active: boolean;
    children: React.ReactNode;
}) {
    return (
        <Link
            href={href}
            className={[
                'flex h-9 items-center justify-center rounded-md text-sm font-medium transition',
                active
                    ? 'bg-[#1f2520] text-white shadow-sm dark:bg-[#efe8da] dark:text-[#151915]'
                    : 'text-[#6c6d66] hover:bg-white dark:text-[#b7b7ad] dark:hover:bg-[#111714]',
            ].join(' ')}
        >
            {children}
        </Link>
    );
}

function Stat({ value, label }: { value: string; label: string }) {
    return (
        <div className="rounded-md border border-[#e1d7c6] bg-[#fbf8f1] p-4 dark:border-[#2d3a32] dark:bg-[#17201b]">
            <div className="text-lg font-semibold">{value}</div>
            <div className="mt-1 text-xs text-[#70746b] dark:text-[#aeb4a8]">{label}</div>
        </div>
    );
}
