import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowRight, Building2, GraduationCap, MessageSquareText, ShieldCheck, UsersRound } from 'lucide-react';

import { login } from '@/routes';

const highlights = [
    {
        icon: UsersRound,
        title: 'Employee control',
        description: 'Create staff, assign roles, and manage permissions for admissions work.',
    },
    {
        icon: MessageSquareText,
        title: 'Inquiry history',
        description: 'Track every student inquiry with streams, status, and follow-up records.',
    },
    {
        icon: Building2,
        title: 'Campus visibility',
        description: 'Enable or hide campus inquiry data from one managed control.',
    },
];

export default function Welcome() {
    const { auth } = usePage().props;
    const dashboardUrl = '/dashboard';

    return (
        <>
            <Head title="Aurea Education CRM" />
            <div className="flex min-h-screen items-center justify-center bg-[#f7f4ef] p-6 text-[#1f2520] lg:p-8 dark:bg-[#0b0f0d] dark:text-[#f5f1e8]">
                <main className="grid w-full max-w-5xl overflow-hidden rounded-lg border border-[#ded7c9] bg-white shadow-sm lg:grid-cols-[1.05fr_0.95fr] dark:border-[#26312b] dark:bg-[#111714]">
                    <section className="flex flex-col justify-between gap-10 p-6 sm:p-10 lg:p-14">
                        <div className="space-y-8">
                            <div className="flex items-center gap-3">
                                <div className="flex size-14 items-center justify-center overflow-hidden rounded-md border border-[#e1d7c6] bg-[#fbf8f1] dark:border-[#2d3a32] dark:bg-[#17201b]">
                                    <img src="/logo.jpeg" alt="Aurea Education logo" className="size-full object-contain p-1" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-[#6d745f] dark:text-[#aab49f]">Advanced CRM</p>
                                    <h1 className="text-2xl font-semibold tracking-normal">Aurea Education</h1>
                                </div>
                            </div>

                            <div className="max-w-xl space-y-4">
                                <h2 className="text-4xl font-semibold tracking-normal text-balance sm:text-5xl">
                                    Manage student inquiries with clarity.
                                </h2>
                                <p className="text-base leading-7 text-[#6c6d66] dark:text-[#b7b7ad]">
                                    A focused CRM for education teams to manage employees, inquiries, streams, programs,
                                    campuses, assignments, and follow-up history in one place.
                                </p>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-3">
                                <Stat value="360" label="Inquiry view" />
                                <Stat value="Roles" label="Access control" />
                                <Stat value="CSV" label="Bulk import" />
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <Link
                                href={auth.user ? dashboardUrl : login()}
                                className="inline-flex h-10 items-center gap-2 rounded-md bg-[#1f2520] px-5 text-sm font-medium text-white transition hover:bg-[#111512] dark:bg-[#efe8da] dark:text-[#151915] dark:hover:bg-white"
                            >
                                {auth.user ? 'Open dashboard' : 'Login'}
                                <ArrowRight className="size-4" />
                            </Link>
                            <span className="text-sm text-[#7c7b72] dark:text-[#aaa79d]">
                                Secure workspace for admissions and campus teams.
                            </span>
                        </div>
                    </section>

                    <section className="relative overflow-hidden border-t border-[#ded7c9] bg-[#eef3ee] p-6 sm:p-10 lg:border-t-0 lg:border-l dark:border-[#26312b] dark:bg-[#121c17]">
                        <div className="absolute inset-x-0 top-0 h-1 bg-[#7b8f64]" />
                        <div className="flex h-full flex-col justify-between gap-8">
                            <div className="space-y-5">
                                <div className="inline-flex items-center gap-2 rounded-md border border-[#cbd8c6] bg-white px-3 py-2 text-sm font-medium text-[#4f6244] dark:border-[#314235] dark:bg-[#18231d] dark:text-[#b8c8af]">
                                    <GraduationCap className="size-4" />
                                    Education operations suite
                                </div>

                                <div className="space-y-3">
                                    {highlights.map((item) => (
                                        <div
                                            key={item.title}
                                            className="rounded-md border border-[#d7dfd2] bg-white/80 p-4 shadow-sm dark:border-[#28382f] dark:bg-[#17211c]"
                                        >
                                            <div className="mb-2 flex items-center gap-2">
                                                <item.icon className="size-4 text-[#6f835a] dark:text-[#b6c9a8]" />
                                                <h3 className="text-sm font-semibold">{item.title}</h3>
                                            </div>
                                            <p className="text-sm leading-6 text-[#687066] dark:text-[#b6b9ae]">
                                                {item.description}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="rounded-md border border-[#cbd8c6] bg-[#f8fbf5] p-4 dark:border-[#314235] dark:bg-[#19241e]">
                                <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                                    <ShieldCheck className="size-4 text-[#6f835a] dark:text-[#b6c9a8]" />
                                    Built for controlled access
                                </div>
                                <p className="text-sm leading-6 text-[#687066] dark:text-[#b6b9ae]">
                                    Super Admins can manage users, roles, campuses, programs, and inquiry assignment.
                                    Employees work only inside the permissions assigned to them.
                                </p>
                            </div>
                        </div>
                    </section>
                </main>
            </div>
        </>
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
