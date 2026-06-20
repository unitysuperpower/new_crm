import { Head, Link } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowRight,
    BookOpen,
    Building2,
    CalendarClock,
    Check,
    CheckCircle2,
    ChevronRight,
    ClipboardList,
    Download,
    FileDown,
    FileSpreadsheet,
    Filter,
    GraduationCap,
    Globe2,
    History,
    LayoutDashboard,
    LockKeyhole,
    Search,
    ServerCog,
    ShieldCheck,
    Sparkles,
    TerminalSquare,
    Upload,
    UserCheck,
    UsersRound,
} from 'lucide-react';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const navigation = [
    ['start', 'Start here', Sparkles],
    ['roles', 'Roles and access', ShieldCheck],
    ['inquiries', 'Inquiry guide', ClipboardList],
    ['csv', 'CSV imports', FileSpreadsheet],
    ['follow-up', 'Follow-ups and streams', CalendarClock],
    ['reports', 'Reports and letters', FileDown],
    ['management', 'System management', Building2],
    ['hosting', 'Hostinger setup', ServerCog],
    ['help', 'Troubleshooting', AlertCircle],
] as const;

const quickSteps = [
    {
        title: 'Prepare the workspace',
        text: 'Create active campuses, programs, employees, roles, and permissions before daily inquiry work begins.',
        icon: Building2,
    },
    {
        title: 'Capture inquiries',
        text: 'Create a single inquiry from the modal or upload a CSV and review every row before submission.',
        icon: Upload,
    },
    {
        title: 'Assign and follow up',
        text: 'Super Admin assigns ownership. The assigned employee updates details, status, follow-up date, and discussion.',
        icon: UserCheck,
    },
    {
        title: 'Review and report',
        text: 'Use queues, filters, history, PDF reports, and invitation letters to keep work visible and accountable.',
        icon: FileDown,
    },
];

const inquirySteps = [
    [
        'Open the inquiry',
        'Use the View action beside the inquiry checkbox. The complete inquiry opens in a modal.',
    ],
    [
        'Review current details',
        'Status, department, program, campus, assignment, contact details, message, and follow-up date are shown together.',
    ],
    [
        'Edit when permitted',
        'Select the pencil icon. Super Admin, Admin with management permission, or the assigned employee can edit.',
    ],
    [
        'Add the discussion',
        'A stream response is required when submitting an inquiry update so the latest conversation is recorded.',
    ],
    [
        'Submit once',
        'Use the single bottom action to save the inquiry and stream. View-only employees can submit a stream when permitted.',
    ],
];

const csvColumns = [
    ['name', 'Required', 'Student name'],
    ['phone', 'Required', 'Primary phone and duplicate key'],
    ['email', 'Optional', 'Valid email and duplicate key'],
    ['city', 'Optional', 'Current city'],
    ['address', 'Optional', 'Full postal address'],
    ['source', 'Optional', 'Website, Facebook, WhatsApp, referral, etc.'],
    ['program', 'Optional', 'Must match an existing program name'],
    ['previous_program', 'Optional', 'Previous education or qualification'],
    ['campus', 'Optional', 'Matched against active campuses'],
    ['status', 'Required', 'A supported inquiry status'],
    ['department', 'Required', 'admission, academics, or accounts'],
    ['next_follow_up_at', 'Optional', 'Date in YYYY-MM-DD format'],
    ['message', 'Optional', 'Initial inquiry note'],
];

const helpTopics = [
    {
        title: 'The pencil button is not visible',
        text: 'The signed-in employee does not have update permission for that inquiry. Confirm assignment and the Update Assigned Inquiry or Manage Inquiry permission.',
    },
    {
        title: 'An inquiry is missing from the Inquiries page',
        text: 'The Inquiries page only shows records assigned to the signed-in employee. Use Dashboard for all permitted inquiries and confirm the campus is active.',
    },
    {
        title: 'A CSV row was not imported',
        text: 'The system skips duplicate phone numbers or email addresses, including duplicates already stored and duplicates repeated inside the same file.',
    },
    {
        title: 'Invitation letter PDF is unavailable',
        text: 'Postal Communication must be set to Created before the student invitation letter can be generated. Use Sent only after the letter has already been delivered.',
    },
    {
        title: 'A program or campus cannot be deleted',
        text: 'Referenced records are protected. Keep the record or disable the campus so historical inquiry data remains intact.',
    },
    {
        title: 'Filters show unexpected dates',
        text: 'The CRM uses the browser\'s local timezone for dates and timestamps. Table date filters use created_at, follow-up queues use next_follow_up_at, and report date filters use updated_at.',
    },
];

export default function DocumentationIndex() {
    const [search, setSearch] = useState('');
    const matchingTopics = useMemo(() => {
        const query = search.trim().toLowerCase();

        if (query.length < 2) {
            return [];
        }

        return helpTopics.filter(({ title, text }) =>
            `${title} ${text}`.toLowerCase().includes(query),
        );
    }, [search]);

    return (
        <>
            <Head title="User Guide" />
            <div className="crm-page">
                <header className="crm-page-header">
                    <div>
                        <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-primary uppercase">
                            <BookOpen className="size-4" />
                            Aurea CRM handbook
                        </div>
                        <h1 className="crm-page-title">User Guide</h1>
                        <p className="crm-page-description">
                            Practical instructions for managing student
                            inquiries, assignments, follow-ups, CSV imports,
                            reports, employees, campuses, and programs.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button asChild variant="outline">
                            <a href="/documentation/sample-inquiries-upload.csv">
                                <Download />
                                Sample CSV
                            </a>
                        </Button>
                        <Button asChild>
                            <Link href="/dashboard">
                                Open dashboard
                                <ArrowRight />
                            </Link>
                        </Button>
                    </div>
                </header>

                <div className="grid min-w-0 gap-6 xl:grid-cols-[15rem_minmax(0,1fr)]">
                    <aside className="hidden xl:block">
                        <div className="sticky top-20 space-y-4">
                            <nav className="border-l" aria-label="User guide">
                                {navigation.map(([id, label, Icon]) => (
                                    <a
                                        key={id}
                                        href={`#${id}`}
                                        className="flex items-center gap-2.5 border-l-2 border-transparent px-4 py-2.5 text-sm text-muted-foreground transition hover:border-primary hover:bg-muted/40 hover:text-foreground"
                                    >
                                        <Icon className="size-4" />
                                        {label}
                                    </a>
                                ))}
                            </nav>
                            <div className="rounded-md border bg-muted/20 p-4">
                                <div className="text-xs font-semibold uppercase">
                                    Current system
                                </div>
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                    <Badge variant="secondary">3 roles</Badge>
                                    <Badge variant="secondary">
                                        PDF export
                                    </Badge>
                                    <Badge variant="secondary">
                                        CSV archive
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </aside>

                    <main className="min-w-0 space-y-12">
                        <section id="start" className="scroll-mt-24 space-y-5">
                            <SectionTitle
                                icon={Sparkles}
                                eyebrow="Quick start"
                                title="Start with the daily workflow"
                                description="The CRM is designed around clear ownership: capture the inquiry, assign it, record every discussion, and schedule the next action."
                            />
                            <div className="grid border md:grid-cols-2 xl:grid-cols-4">
                                {quickSteps.map((step, index) => (
                                    <div
                                        key={step.title}
                                        className="border-b p-5 last:border-b-0 md:border-r xl:border-b-0 xl:last:border-r-0 md:[&:nth-child(2)]:border-r-0 xl:[&:nth-child(2)]:border-r"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                                                <step.icon className="size-4" />
                                            </span>
                                            <span className="text-xs font-semibold text-muted-foreground">
                                                0{index + 1}
                                            </span>
                                        </div>
                                        <h3 className="mt-4 text-sm font-semibold">
                                            {step.title}
                                        </h3>
                                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                            {step.text}
                                        </p>
                                    </div>
                                ))}
                            </div>
                            <div className="grid gap-3 md:grid-cols-3">
                                <QuickAction
                                    href="/dashboard"
                                    icon={LayoutDashboard}
                                    title="Dashboard"
                                    text="All permitted inquiries and assignment work"
                                />
                                <QuickAction
                                    href="/inquiries"
                                    icon={ClipboardList}
                                    title="Assigned inquiries"
                                    text="Your assigned records and follow-up queues"
                                />
                                <QuickAction
                                    href="/documentation/sample-inquiries-upload.csv"
                                    icon={FileSpreadsheet}
                                    title="CSV template"
                                    text="Download the current import structure"
                                />
                            </div>
                        </section>

                        <section id="roles" className="scroll-mt-24 space-y-5">
                            <SectionTitle
                                icon={ShieldCheck}
                                eyebrow="Access control"
                                title="Roles and responsibilities"
                                description="Menus and actions only appear when the employee has the required permission. Super Admin controls employee permissions."
                            />
                            <div className="overflow-x-auto border">
                                <table className="w-full min-w-[760px] text-sm">
                                    <thead className="bg-muted/60 text-muted-foreground">
                                        <tr>
                                            <Th>Role</Th>
                                            <Th>Primary responsibility</Th>
                                            <Th>Important limits</Th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <RoleRow
                                            role="Super Admin"
                                            responsibility="Manages employees, permissions, programs, campuses, all inquiries, assignment, reassignment, imports, and reports."
                                            limit="Only role that can assign or reassign inquiry ownership."
                                        />
                                        <RoleRow
                                            role="Admin"
                                            responsibility="Manages inquiry operations and reference data according to granted permissions."
                                            limit="Cannot assign inquiries unless the role policy is changed."
                                        />
                                        <RoleRow
                                            role="User"
                                            responsibility="Creates inquiries, works assigned inquiries, schedules follow-ups, and records discussions."
                                            limit="Only edits assigned inquiries and only sees permitted menu items."
                                        />
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        <section
                            id="inquiries"
                            className="scroll-mt-24 space-y-5"
                        >
                            <SectionTitle
                                icon={ClipboardList}
                                eyebrow="Core workflow"
                                title="Create, view, and update inquiries"
                                description="Inquiry forms open in modals so employees keep their table context while creating, reviewing, and updating records."
                            />
                            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
                                <div className="divide-y border">
                                    {inquirySteps.map(
                                        ([title, text], index) => (
                                            <GuideStep
                                                key={title}
                                                number={index + 1}
                                                title={title}
                                                text={text}
                                            />
                                        ),
                                    )}
                                </div>
                                <div className="space-y-3">
                                    <InfoPanel
                                        icon={LayoutDashboard}
                                        title="Dashboard scope"
                                        text="Shows all inquiries allowed by permissions and active-campus visibility. Super Admin assigns from this table."
                                    />
                                    <InfoPanel
                                        icon={UserCheck}
                                        title="Inquiries scope"
                                        text="Shows only inquiries assigned to the signed-in employee, including assigned-today and follow-up queues."
                                    />
                                    <InfoPanel
                                        icon={LockKeyhole}
                                        title="Editing control"
                                        text="The pencil icon appears only when the employee can update that inquiry."
                                    />
                                </div>
                            </div>
                        </section>

                        <section id="csv" className="scroll-mt-24 space-y-5">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                                <SectionTitle
                                    icon={FileSpreadsheet}
                                    eyebrow="Bulk capture"
                                    title="CSV import guide"
                                    description="Upload a CSV, review the parsed rows, and submit up to 500 inquiries in one operation."
                                />
                                <Button asChild variant="outline">
                                    <a href="/documentation/sample-inquiries-upload.csv">
                                        <Download />
                                        Download template
                                    </a>
                                </Button>
                            </div>
                            <div className="grid gap-3 md:grid-cols-3">
                                <InfoPanel
                                    icon={Search}
                                    title="Review before submit"
                                    text="The CSV opens in a preview modal. Confirm mappings, dates, campus, program, and status values."
                                />
                                <InfoPanel
                                    icon={CheckCircle2}
                                    title="Duplicate protection"
                                    text="Matching phone numbers or emails are skipped, including repeats inside the same uploaded file."
                                />
                                <InfoPanel
                                    icon={History}
                                    title="Private archive"
                                    text="The original CSV is stored privately with its original name plus the upload date and time."
                                />
                            </div>
                            <div className="overflow-x-auto border">
                                <table className="w-full min-w-[780px] text-sm">
                                    <thead className="bg-muted/60 text-muted-foreground">
                                        <tr>
                                            <Th>CSV column</Th>
                                            <Th>Requirement</Th>
                                            <Th>Use</Th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {csvColumns.map(
                                            ([name, requirement, use]) => (
                                                <tr
                                                    key={name}
                                                    className="crm-table-row"
                                                >
                                                    <Td>
                                                        <code className="rounded bg-muted px-1.5 py-1 text-xs">
                                                            {name}
                                                        </code>
                                                    </Td>
                                                    <Td>
                                                        <Badge
                                                            variant={
                                                                requirement ===
                                                                'Required'
                                                                    ? 'secondary'
                                                                    : 'outline'
                                                            }
                                                        >
                                                            {requirement}
                                                        </Badge>
                                                    </Td>
                                                    <Td>{use}</Td>
                                                </tr>
                                            ),
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <Notice title="Assignment remains separate">
                                CSV imports do not assign employees. Imported
                                inquiries enter the Dashboard as unassigned, and
                                Super Admin assigns them from the inquiry table.
                            </Notice>
                        </section>

                        <section
                            id="follow-up"
                            className="scroll-mt-24 space-y-5"
                        >
                            <SectionTitle
                                icon={CalendarClock}
                                eyebrow="Daily work"
                                title="Follow-ups and discussion streams"
                                description="Queues organize the day while the stream preserves the complete employee discussion history."
                            />
                            <div className="grid gap-5 lg:grid-cols-2">
                                <div className="border">
                                    <PanelHeader title="Follow-up queues" />
                                    <Queue
                                        name="Assigned today"
                                        text="Inquiries assigned today that still need activity."
                                    />
                                    <Queue
                                        name="Yesterday"
                                        text="Overdue follow-ups scheduled for yesterday."
                                    />
                                    <Queue
                                        name="Today"
                                        text="Follow-ups due on the current Karachi date."
                                    />
                                    <Queue
                                        name="Next 3 days"
                                        text="Upcoming follow-ups over the next three days."
                                    />
                                </div>
                                <div className="border">
                                    <PanelHeader title="Discussion history" />
                                    <CheckRow text="History appears on the right side of the inquiry modal." />
                                    <CheckRow text="All shows the complete timeline; employee tabs filter by contributor." />
                                    <CheckRow text="Every stream records the employee, response, timestamp, and status at that time." />
                                    <CheckRow text="Employees with stream permission may add discussion even when they cannot edit details." />
                                </div>
                            </div>
                        </section>

                        <section
                            id="reports"
                            className="scroll-mt-24 space-y-5"
                        >
                            <SectionTitle
                                icon={FileDown}
                                eyebrow="Output"
                                title="Reports and PDF letters"
                                description="Generate operational reports from assigned inquiries and formal student invitation letters from eligible records."
                            />
                            <div className="grid gap-5 lg:grid-cols-2">
                                <div className="border p-5">
                                    <div className="flex items-center gap-2">
                                        <Filter className="size-4 text-primary" />
                                        <h3 className="text-sm font-semibold">
                                            Inquiry report
                                        </h3>
                                    </div>
                                    <ul className="mt-4 space-y-3">
                                        <CheckItem text="Filter by campus, status, employee, and updated date range." />
                                        <CheckItem text="Today Report uses the current Asia/Karachi date." />
                                        <CheckItem text="Preview totals and non-zero status counts before download." />
                                        <CheckItem text="PDF uses the Aurea Education branded report format." />
                                    </ul>
                                </div>
                                <div className="border p-5">
                                    <div className="flex items-center gap-2">
                                        <GraduationCap className="size-4 text-primary" />
                                        <h3 className="text-sm font-semibold">
                                            Invitation letter
                                        </h3>
                                    </div>
                                    <ul className="mt-4 space-y-3">
                                        <CheckItem text="Set Postal Communication to Created to generate the letter PDF." />
                                        <CheckItem text="Set Postal Communication to Sent after the letter has already been delivered." />
                                        <CheckItem text="Use the PDF icon in the table or inquiry detail modal." />
                                        <CheckItem text="The letter includes student, contact, program, campus, and address details." />
                                        <CheckItem text="Filename follows student-inquiry-Student-Name.pdf." />
                                    </ul>
                                </div>
                            </div>
                        </section>

                        <section
                            id="management"
                            className="scroll-mt-24 space-y-5"
                        >
                            <SectionTitle
                                icon={UsersRound}
                                eyebrow="Administration"
                                title="Manage the CRM workspace"
                                description="Reference data and employee access determine what can be selected and what each person can do."
                            />
                            <div className="grid gap-3 md:grid-cols-2">
                                <InfoPanel
                                    icon={UsersRound}
                                    title="Employees"
                                    text="Super Admin maintains profile details, role, permissions, department, designation, campus, and contact information."
                                />
                                <InfoPanel
                                    icon={Building2}
                                    title="Campuses"
                                    text="Create, edit, search, and toggle visibility. Turning a campus off hides its inquiries without deleting history."
                                />
                                <InfoPanel
                                    icon={GraduationCap}
                                    title="Programs"
                                    text="Create and maintain program name, duration, and related reference information used by inquiries."
                                />
                                <InfoPanel
                                    icon={LockKeyhole}
                                    title="Profile and security"
                                    text="Employees update their profile, password, two-factor authentication, passkeys, and theme preferences from Settings."
                                />
                            </div>
                        </section>

                        <section
                            id="hosting"
                            className="scroll-mt-24 space-y-5"
                        >
                            <SectionTitle
                                icon={ServerCog}
                                eyebrow="Deployment"
                                title="Hostinger and cPanel setup"
                                description="Use this checklist when moving the CRM from local Docker to a live Hostinger account."
                            />
                            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
                                <div className="space-y-4">
                                    <HostStep
                                        number={1}
                                        title="Build the project before upload"
                                        text="Run composer install for production dependencies and npm run build so the Vite assets are available in public/build."
                                        command="composer install --no-dev --optimize-autoloader && npm install && npm run build"
                                    />
                                    <HostStep
                                        number={2}
                                        title="Set the document root to public"
                                        text="The domain should point to the Laravel public folder, not the project root. This protects .env, storage, and application code."
                                        command="/home/youruser/aurea-crm/public"
                                    />
                                    <HostStep
                                        number={3}
                                        title="Create production environment"
                                        text="Create the Hostinger MySQL database, update .env with live credentials, set APP_DEBUG=false, and generate APP_KEY."
                                        command="php artisan key:generate --force"
                                    />
                                    <HostStep
                                        number={4}
                                        title="Run Laravel server commands"
                                        text="Run migrations, create the storage link, and rebuild Laravel caches after the final .env file is ready."
                                        command="php artisan migrate --force && php artisan storage:link && php artisan optimize"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <InfoPanel
                                        icon={Globe2}
                                        title="Live URL"
                                        text="Set APP_URL to the exact https domain that users will open."
                                    />
                                    <InfoPanel
                                        icon={TerminalSquare}
                                        title="Server terminal"
                                        text="Use Hostinger SSH terminal when available. If SSH is not enabled, upload the built project and ask Hostinger support to run the artisan commands."
                                    />
                                    <InfoPanel
                                        icon={LockKeyhole}
                                        title="Writable folders"
                                        text="storage and bootstrap/cache must be writable by PHP or uploads, sessions, logs, and cache will fail."
                                    />
                                    <Notice title="Repository guide">
                                        A full deployment checklist is saved in
                                        HOSTINGER_CPANEL_DEPLOYMENT.md at the
                                        project root.
                                    </Notice>
                                    <Button
                                        asChild
                                        variant="outline"
                                        className="w-full justify-start"
                                    >
                                        <a href="/documentation/hostinger-cpanel-deployment.md">
                                            <Download />
                                            Download Hostinger guide
                                        </a>
                                    </Button>
                                </div>
                            </div>
                        </section>

                        <section
                            id="help"
                            className="scroll-mt-24 space-y-5 pb-8"
                        >
                            <SectionTitle
                                icon={AlertCircle}
                                eyebrow="Support"
                                title="Troubleshooting"
                                description="Search the most common operational questions before escalating an issue."
                            />
                            <div className="relative max-w-2xl">
                                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    className="h-11 pl-9"
                                    placeholder="Search help topics"
                                />
                            </div>
                            <div className="divide-y border">
                                {(search.trim().length >= 2
                                    ? matchingTopics
                                    : helpTopics
                                ).map((topic) => (
                                    <details
                                        key={topic.title}
                                        className="group p-4 sm:p-5"
                                    >
                                        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold">
                                            {topic.title}
                                            <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />
                                        </summary>
                                        <p className="mt-3 max-w-4xl text-sm leading-6 text-muted-foreground">
                                            {topic.text}
                                        </p>
                                    </details>
                                ))}
                                {search.trim().length >= 2 &&
                                    matchingTopics.length === 0 && (
                                        <div className="p-8 text-center text-sm text-muted-foreground">
                                            No help topic matches "
                                            {search.trim()}".
                                        </div>
                                    )}
                            </div>
                        </section>
                    </main>
                </div>
            </div>
        </>
    );
}

function SectionTitle({
    icon: Icon,
    eyebrow,
    title,
    description,
}: {
    icon: typeof BookOpen;
    eyebrow: string;
    title: string;
    description: string;
}) {
    return (
        <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Icon className="size-5" />
            </span>
            <div>
                <div className="text-xs font-semibold text-primary uppercase">
                    {eyebrow}
                </div>
                <h2 className="mt-1 text-xl font-semibold">{title}</h2>
                <p className="mt-1 max-w-4xl text-sm leading-6 text-muted-foreground">
                    {description}
                </p>
            </div>
        </div>
    );
}

function QuickAction({
    href,
    icon: Icon,
    title,
    text,
}: {
    href: string;
    icon: typeof LayoutDashboard;
    title: string;
    text: string;
}) {
    return (
        <a
            href={href}
            className="group flex items-start gap-3 border p-4 transition hover:border-primary/40 hover:bg-muted/30"
        >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Icon className="size-4" />
            </span>
            <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-3 text-sm font-semibold">
                    {title}
                    <ArrowRight className="size-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
                </span>
                <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                    {text}
                </span>
            </span>
        </a>
    );
}

function GuideStep({
    number,
    title,
    text,
}: {
    number: number;
    title: string;
    text: string;
}) {
    return (
        <div className="grid gap-3 p-5 sm:grid-cols-[2.5rem_1fr]">
            <span className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-xs font-semibold text-primary">
                {number}
            </span>
            <div>
                <h3 className="text-sm font-semibold">{title}</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {text}
                </p>
            </div>
        </div>
    );
}

function HostStep({
    number,
    title,
    text,
    command,
}: {
    number: number;
    title: string;
    text: string;
    command: string;
}) {
    return (
        <div className="border p-5">
            <div className="flex items-start gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-semibold text-primary">
                    {number}
                </span>
                <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold">{title}</h3>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {text}
                    </p>
                    <code className="mt-3 block overflow-x-auto rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                        {command}
                    </code>
                </div>
            </div>
        </div>
    );
}

function InfoPanel({
    icon: Icon,
    title,
    text,
}: {
    icon: typeof ShieldCheck;
    title: string;
    text: string;
}) {
    return (
        <div className="border p-4">
            <div className="flex items-center gap-2">
                <Icon className="size-4 text-primary" />
                <h3 className="text-sm font-semibold">{title}</h3>
            </div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {text}
            </p>
        </div>
    );
}

function RoleRow({
    role,
    responsibility,
    limit,
}: {
    role: string;
    responsibility: string;
    limit: string;
}) {
    return (
        <tr className="crm-table-row">
            <Td>
                <Badge variant="secondary">{role}</Badge>
            </Td>
            <Td>{responsibility}</Td>
            <Td>{limit}</Td>
        </tr>
    );
}

function PanelHeader({ title }: { title: string }) {
    return (
        <div className="border-b bg-muted/30 px-4 py-3 text-sm font-semibold">
            {title}
        </div>
    );
}

function Queue({ name, text }: { name: string; text: string }) {
    return (
        <div className="grid gap-2 border-b p-4 last:border-b-0 sm:grid-cols-[8rem_1fr]">
            <span className="text-sm font-medium">{name}</span>
            <span className="text-sm leading-6 text-muted-foreground">
                {text}
            </span>
        </div>
    );
}

function CheckRow({ text }: { text: string }) {
    return (
        <div className="flex gap-3 border-b p-4 last:border-b-0">
            <Check className="mt-1 size-4 shrink-0 text-primary" />
            <p className="text-sm leading-6 text-muted-foreground">{text}</p>
        </div>
    );
}

function CheckItem({ text }: { text: string }) {
    return (
        <li className="flex gap-2.5 text-sm leading-6 text-muted-foreground">
            <CheckCircle2 className="mt-1 size-4 shrink-0 text-primary" />
            {text}
        </li>
    );
}

function Notice({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div className="border-l-4 border-primary bg-primary/5 px-4 py-3">
            <div className="text-sm font-semibold">{title}</div>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {children}
            </p>
        </div>
    );
}

function Th({ children }: { children: React.ReactNode }) {
    return (
        <th className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap">
            {children}
        </th>
    );
}

function Td({ children }: { children: React.ReactNode }) {
    return <td className="px-4 py-3.5 align-top leading-6">{children}</td>;
}

DocumentationIndex.layout = () => ({
    breadcrumbs: [{ title: 'User Guide', href: '/documentation' }],
});
