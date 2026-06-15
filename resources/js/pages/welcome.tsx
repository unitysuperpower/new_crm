import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    Building2,
    CheckCircle2,
    ClipboardList,
    FileSpreadsheet,
    GraduationCap,
    MessageSquareText,
    ShieldCheck,
    UsersRound,
} from 'lucide-react';

import { login } from '@/routes';

const capabilities = [
    {
        icon: ClipboardList,
        title: 'Inquiry operations',
        description:
            'Capture, assign, filter, and follow every student inquiry from one structured workspace.',
    },
    {
        icon: MessageSquareText,
        title: 'Discussion history',
        description:
            'Keep follow-up notes and employee streams attached to the inquiry record.',
    },
    {
        icon: Building2,
        title: 'Campus control',
        description:
            'Manage campus visibility and keep reporting aligned with active locations.',
    },
    {
        icon: UsersRound,
        title: 'Controlled access',
        description:
            'Use roles and permissions to give each employee the right level of access.',
    },
];

export default function Welcome() {
    const { auth } = usePage().props;

    return (
        <>
            <Head title="Aurea Education CRM" />
            <div className="min-h-screen bg-background text-foreground">
                <header className="border-b bg-background/90">
                    <div className="mx-auto flex h-18 max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
                        <div className="flex items-center gap-3">
                            <div className="flex size-11 items-center justify-center overflow-hidden rounded-md border bg-white shadow-sm">
                                <img
                                    src="/logo.jpeg"
                                    alt="Aurea Education logo"
                                    className="size-full object-contain p-1"
                                />
                            </div>
                            <div className="leading-tight">
                                <div className="font-semibold">
                                    Aurea Education
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    Inquiry CRM
                                </div>
                            </div>
                        </div>

                        <Link
                            href={auth.user ? '/dashboard' : login()}
                            className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90"
                        >
                            {auth.user ? 'Open dashboard' : 'Employee login'}
                            <ArrowRight className="size-4" />
                        </Link>
                    </div>
                </header>

                <main>
                    <section className="border-b">
                        <div className="mx-auto grid max-w-[1440px] gap-12 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:px-12 lg:py-24">
                            <div className="flex flex-col justify-center">
                                <div className="mb-6 inline-flex w-fit items-center gap-2 text-sm font-medium text-primary">
                                    <GraduationCap className="size-4" />
                                    Education operations workspace
                                </div>
                                <h1 className="max-w-3xl text-4xl font-semibold text-balance sm:text-5xl lg:text-6xl lg:leading-[1.05]">
                                    Student inquiry management, made clear.
                                </h1>
                                <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                                    Aurea Education CRM brings inquiry
                                    assignment, follow-up history, programs,
                                    campuses, employees, and reports into one
                                    controlled workspace.
                                </p>

                                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                                    <Link
                                        href={
                                            auth.user ? '/dashboard' : login()
                                        }
                                        className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90"
                                    >
                                        {auth.user
                                            ? 'Go to dashboard'
                                            : 'Sign in to CRM'}
                                        <ArrowRight className="size-4" />
                                    </Link>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <ShieldCheck className="size-4 text-primary" />
                                        Administrator-managed employee access
                                    </div>
                                </div>
                            </div>

                            <div className="crm-panel self-center p-5 sm:p-6">
                                <div className="flex items-center justify-between border-b pb-4">
                                    <div>
                                        <div className="text-sm font-semibold">
                                            Admissions overview
                                        </div>
                                        <div className="mt-1 text-xs text-muted-foreground">
                                            A focused view of daily inquiry work
                                        </div>
                                    </div>
                                    <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                                        Active
                                    </span>
                                </div>

                                <div className="grid gap-3 py-5 sm:grid-cols-3">
                                    <PreviewMetric
                                        label="Inquiries"
                                        value="All"
                                    />
                                    <PreviewMetric
                                        label="Follow-ups"
                                        value="Tracked"
                                    />
                                    <PreviewMetric
                                        label="Reports"
                                        value="PDF"
                                    />
                                </div>

                                <div className="overflow-hidden rounded-md border">
                                    <div className="grid grid-cols-[1fr_auto] bg-muted px-4 py-2.5 text-xs font-semibold text-muted-foreground">
                                        <span>Workflow</span>
                                        <span>Status</span>
                                    </div>
                                    <PreviewRow
                                        icon={FileSpreadsheet}
                                        label="CSV inquiry review"
                                        status="Ready"
                                    />
                                    <PreviewRow
                                        icon={UsersRound}
                                        label="Employee assignment"
                                        status="Controlled"
                                    />
                                    <PreviewRow
                                        icon={Building2}
                                        label="Campus visibility"
                                        status="Managed"
                                    />
                                    <PreviewRow
                                        icon={MessageSquareText}
                                        label="Stream history"
                                        status="Recorded"
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="mx-auto max-w-[1440px] px-5 py-14 sm:px-8 lg:px-12 lg:py-18">
                        <div className="mb-8 max-w-2xl">
                            <h2 className="text-2xl font-semibold">
                                Built around the admissions workflow
                            </h2>
                            <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                Every module supports clear ownership,
                                continuous history, and permission-aware
                                teamwork.
                            </p>
                        </div>
                        <div className="grid gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-2 lg:grid-cols-4">
                            {capabilities.map((capability) => (
                                <div
                                    key={capability.title}
                                    className="bg-card p-5"
                                >
                                    <div className="mb-4 flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                                        <capability.icon className="size-4" />
                                    </div>
                                    <h3 className="text-sm font-semibold">
                                        {capability.title}
                                    </h3>
                                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                        {capability.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>
                </main>

                <footer className="border-t">
                    <div className="mx-auto flex max-w-[1440px] flex-col gap-2 px-5 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
                        <span>Aurea Education inquiry management system</span>
                        <span className="inline-flex items-center gap-1.5">
                            <CheckCircle2 className="size-3.5 text-primary" />
                            Secure employee access
                        </span>
                    </div>
                </footer>
            </div>
        </>
    );
}

function PreviewMetric({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-md border bg-muted/25 px-3 py-3">
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className="mt-1 text-sm font-semibold">{value}</div>
        </div>
    );
}

function PreviewRow({
    icon: Icon,
    label,
    status,
}: {
    icon: typeof Building2;
    label: string;
    status: string;
}) {
    return (
        <div className="grid grid-cols-[1fr_auto] items-center gap-4 border-t px-4 py-3 text-sm">
            <span className="flex items-center gap-2.5 font-medium">
                <Icon className="size-4 text-muted-foreground" />
                {label}
            </span>
            <span className="text-xs text-muted-foreground">{status}</span>
        </div>
    );
}
