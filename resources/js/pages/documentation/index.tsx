import { Head, Link } from '@inertiajs/react';
import {
    ArrowRight,
    BookOpen,
    Building2,
    CalendarClock,
    CheckCircle2,
    ClipboardList,
    Download,
    FileDown,
    FileSpreadsheet,
    Filter,
    GraduationCap,
    History,
    LayoutDashboard,
    ListFilter,
    LockKeyhole,
    MessageSquareText,
    Search,
    ShieldCheck,
    UserCheck,
    UsersRound,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const sections = [
    ['overview', 'Overview'],
    ['daily-work', 'Daily work'],
    ['screens', 'Screens'],
    ['workflow', 'Workflow'],
    ['access', 'Access'],
    ['reports', 'Reports'],
    ['csv', 'CSV import'],
    ['rules', 'Rules'],
] as const;

const modules = [
    {
        title: 'Dashboard',
        icon: LayoutDashboard,
        description:
            'Shows all inquiries visible through active campuses, with search, filters, assignment, and pagination.',
        features: [
            'All inquiries',
            'Campus controls',
            'Bulk assignment',
            'Pagination',
        ],
    },
    {
        title: 'Assigned inquiries',
        icon: ClipboardList,
        description:
            'Shows every inquiry assigned to the signed-in employee, including records without a follow-up date.',
        features: ['My assignments', 'Date queues', 'Streams', 'Reports'],
    },
    {
        title: 'Programs',
        icon: GraduationCap,
        description:
            'Maintains program name, duration, and fee options used by inquiry records.',
        features: ['Create', 'Edit', 'Search', 'Usage count'],
    },
    {
        title: 'Campuses',
        icon: Building2,
        description:
            'Maintains campus details and controls whether related inquiries remain visible.',
        features: ['Create', 'Edit', 'Visibility', 'Usage count'],
    },
    {
        title: 'Users and settings',
        icon: UsersRound,
        description:
            'Manages existing employee roles, permissions, profile information, security, and appearance.',
        features: ['Roles', 'Permissions', 'Profile', 'Security'],
    },
];

const workflow = [
    [
        'Prepare reference data',
        'Create the programs and campuses employees will select in inquiry forms and CSV imports.',
    ],
    [
        'Capture inquiries',
        'Add an inquiry through the modal form or upload a CSV and review every row before submission. CSV rows are created unassigned.',
    ],
    [
        'Assign ownership',
        'A Super Admin selects one or more inquiries and assigns or reassigns them to an employee.',
    ],
    [
        'Work the inquiry',
        'The assigned employee updates status, department, and next follow-up date from the detail modal.',
    ],
    [
        'Record discussion',
        'Submit a required stream response with each assigned-inquiry update so the complete discussion history remains available.',
    ],
    [
        'Review and report',
        'Use filters and pagination for daily work, or generate an updated-date report with PDF download.',
    ],
];

const roleRows = [
    {
        role: 'Super Admin',
        access: 'All system permissions, user management, inquiry assignment and reassignment, reports, campuses, and programs.',
    },
    {
        role: 'Admin',
        access: 'Views and manages inquiries, imports CSV files, creates streams, and manages programs and campuses. Assignment remains Super Admin only.',
    },
    {
        role: 'User',
        access: 'Views and creates inquiries, updates inquiries assigned to them, and adds discussion streams.',
    },
];

const csvColumns = [
    ['name', 'Required', 'Student or inquiry name'],
    ['phone', 'Required', 'Primary contact number'],
    ['email', 'Optional', 'Valid email address'],
    ['city', 'Optional', 'Current city'],
    ['address', 'Optional', 'Full address'],
    [
        'source',
        'Optional',
        'Lead source such as Website, Facebook, or WhatsApp',
    ],
    ['program', 'Optional', 'Program name matched with the program list'],
    ['previous_program', 'Optional', 'Previous education or program'],
    ['campus', 'Optional', 'Campus name; active campuses can be selected'],
    ['status', 'Required', 'Must match one of the supported inquiry statuses'],
    ['department', 'Required', 'admission, academics, or accounts'],
    ['next_follow_up_at', 'Optional', 'Date in YYYY-MM-DD format'],
    ['message', 'Optional', 'Initial inquiry discussion or request'],
];

const statuses = [
    'pending',
    'not sure',
    'not interested',
    'not eligible',
    'interested',
    'call back',
    'distance problem',
    'not responding',
    'for job',
    'will visit',
    'visited',
    'p.o',
    'online/short course',
    'e-t paid',
    'admission fee paid',
    'master classes',
];

export default function DocumentationIndex() {
    return (
        <>
            <Head title="Project Documentation" />
            <div className="crm-page">
                <header className="crm-page-header">
                    <div>
                        <div className="mb-2 inline-flex items-center gap-2 text-xs font-semibold tracking-normal text-primary uppercase">
                            <BookOpen className="size-4" />
                            System handbook
                        </div>
                        <h1 className="crm-page-title">
                            Aurea Education CRM documentation
                        </h1>
                        <p className="crm-page-description">
                            Current guide to inquiry operations, employee
                            access, campus visibility, reporting, CSV imports,
                            and the limitations enforced by the system.
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

                <nav
                    className="crm-panel sticky top-16 z-20 flex gap-1 overflow-x-auto bg-card/95 p-2 backdrop-blur"
                    aria-label="Documentation sections"
                >
                    {sections.map(([id, label]) => (
                        <a
                            key={id}
                            href={`#${id}`}
                            className="rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap text-muted-foreground transition hover:bg-muted hover:text-foreground"
                        >
                            {label}
                        </a>
                    ))}
                </nav>

                <section id="overview" className="scroll-mt-32 space-y-4">
                    <SectionHeading
                        icon={ShieldCheck}
                        title="System overview"
                        description="A permission-aware CRM for managing education inquiries from capture through follow-up and reporting."
                    />
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <Metric
                            label="Primary modules"
                            value="5"
                            note="Inquiry, stream, program, campus, user"
                        />
                        <Metric
                            label="Defined roles"
                            value="3"
                            note="Super Admin, Admin, User"
                        />
                        <Metric
                            label="Follow-up queues"
                            value="5"
                            note="All, assigned today, yesterday, today, next 3 days"
                        />
                        <Metric
                            label="Report format"
                            value="PDF"
                            note="Preview before download"
                        />
                    </div>
                    <div className="crm-panel grid gap-0 lg:grid-cols-3">
                        <PurposeBlock
                            icon={UserCheck}
                            title="Clear ownership"
                            text="Every assigned inquiry has a responsible employee. Super Admin can reassign ownership when work changes."
                        />
                        <PurposeBlock
                            icon={History}
                            title="Continuous history"
                            text="Stream notes remain attached to the inquiry and can be reviewed by all or filtered by contributing employee."
                        />
                        <PurposeBlock
                            icon={LockKeyhole}
                            title="Controlled access"
                            text="Navigation and actions are permission-aware. Public registration is disabled; employee access is managed internally."
                        />
                    </div>
                    <div className="grid gap-3 md:grid-cols-3">
                        <QuickLink
                            href="/dashboard"
                            icon={LayoutDashboard}
                            title="Open the full register"
                            text="Search, filter, select, assign, and review every visible inquiry."
                        />
                        <QuickLink
                            href="/inquiries"
                            icon={ClipboardList}
                            title="Open my assignments"
                            text="Work assigned inquiries and organize follow-ups by date."
                        />
                        <QuickLink
                            href="/documentation/sample-inquiries-upload.csv"
                            icon={FileSpreadsheet}
                            title="Download CSV template"
                            text="Start with the supported columns and ten example records."
                            download
                        />
                    </div>
                </section>

                <section id="daily-work" className="scroll-mt-32 space-y-4">
                    <SectionHeading
                        icon={ListFilter}
                        title="Daily inquiry workspace"
                        description="Use the Dashboard for oversight and assignment; use Inquiries for personal follow-up work."
                    />
                    <div className="grid gap-4 lg:grid-cols-2">
                        <WorkspaceGuide
                            icon={LayoutDashboard}
                            title="Dashboard"
                            audience="Super Admin and permitted managers"
                            points={[
                                'Shows all inquiries across active campuses.',
                                'Includes both assigned and unassigned records.',
                                'Supports search, filters, pagination, and bulk assignment.',
                                'Assigned today counts records whose assignment date is today.',
                            ]}
                        />
                        <WorkspaceGuide
                            icon={UserCheck}
                            title="Inquiries"
                            audience="Signed-in employee"
                            points={[
                                'Shows only inquiries assigned to the current employee.',
                                'Keeps assigned records visible even when no follow-up date is set.',
                                'Allows inquiry updates only with a stream response.',
                                'Provides report preview and PDF download within the permitted scope.',
                            ]}
                        />
                    </div>
                    <div className="crm-panel overflow-x-auto">
                        <table className="w-full min-w-[720px] text-sm">
                            <thead className="bg-muted text-muted-foreground">
                                <tr>
                                    <Th>Queue</Th>
                                    <Th>Date rule</Th>
                                    <Th>Use</Th>
                                </tr>
                            </thead>
                            <tbody>
                                <QueueRow
                                    name="All assigned"
                                    rule="Any date, including no follow-up date"
                                    use="Complete personal workload"
                                />
                                <QueueRow
                                    name="Assigned today"
                                    rule="Assignment date is today"
                                    use="Review newly assigned ownership"
                                />
                                <QueueRow
                                    name="Yesterday"
                                    rule="Follow-up date was yesterday"
                                    use="Recover missed follow-ups"
                                />
                                <QueueRow
                                    name="Today"
                                    rule="Follow-up date is today"
                                    use="Current priority calls"
                                />
                                <QueueRow
                                    name="Next 3 days"
                                    rule="Tomorrow through three days ahead"
                                    use="Prepare upcoming work"
                                />
                            </tbody>
                        </table>
                    </div>
                </section>

                <section id="screens" className="scroll-mt-32 space-y-4">
                    <SectionHeading
                        icon={LayoutDashboard}
                        title="Screens and modules"
                        description="What each main area is responsible for and how employees should use it."
                    />
                    <div className="grid gap-px overflow-hidden rounded-lg border bg-border md:grid-cols-2 xl:grid-cols-5">
                        {modules.map((module) => (
                            <ModuleCard key={module.title} {...module} />
                        ))}
                    </div>
                    <Callout title="Dashboard and inquiry page are intentionally different">
                        The Dashboard shows the complete inquiry register across
                        active campuses, including records waiting for
                        assignment. The Inquiries screen only shows records
                        assigned to the logged-in employee, with Yesterday,
                        Today, and Next 3 days follow-up views. Both tables
                        paginate at the bottom.
                    </Callout>
                </section>

                <section id="workflow" className="scroll-mt-32 space-y-4">
                    <SectionHeading
                        icon={ClipboardList}
                        title="Inquiry workflow"
                        description="Recommended order for capturing, assigning, following, and reporting inquiries."
                    />
                    <div className="crm-panel divide-y">
                        {workflow.map(([title, text], index) => (
                            <div
                                key={title}
                                className="grid gap-3 p-4 sm:grid-cols-[2.5rem_12rem_1fr] sm:items-start sm:p-5"
                            >
                                <span className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-sm font-semibold text-primary">
                                    {index + 1}
                                </span>
                                <h3 className="text-sm font-semibold">
                                    {title}
                                </h3>
                                <p className="text-sm leading-6 text-muted-foreground">
                                    {text}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                <section id="access" className="scroll-mt-32 space-y-4">
                    <SectionHeading
                        icon={UsersRound}
                        title="Roles and permissions"
                        description="Default role capabilities can be refined through the employee permission controls."
                    />
                    <div className="crm-panel overflow-x-auto">
                        <table className="w-full min-w-[760px] text-sm">
                            <thead className="bg-muted text-muted-foreground">
                                <tr>
                                    <Th>Role</Th>
                                    <Th>Default operating access</Th>
                                    <Th>Important limitation</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {roleRows.map((row) => (
                                    <tr
                                        key={row.role}
                                        className="crm-table-row"
                                    >
                                        <Td>
                                            <Badge variant="secondary">
                                                {row.role}
                                            </Badge>
                                        </Td>
                                        <Td>{row.access}</Td>
                                        <Td>
                                            {row.role === 'Super Admin'
                                                ? 'Full access'
                                                : row.role === 'Admin'
                                                  ? 'Cannot assign or reassign inquiries'
                                                  : 'Can update only assigned inquiries'}
                                        </Td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        <Rule
                            icon={ShieldCheck}
                            title="Assignment"
                            text="Only Super Admin can bulk assign or reassign inquiries."
                        />
                        <Rule
                            icon={UserCheck}
                            title="Updates"
                            text="The assigned employee can update the complete inquiry record, including department. Admin can update any inquiry; reassignment remains Super Admin only."
                        />
                        <Rule
                            icon={MessageSquareText}
                            title="Streams"
                            text="Employees with Add Inquiry Streams permission can submit discussion notes. A response is required when the assigned user updates an inquiry."
                        />
                        <Rule
                            icon={LockKeyhole}
                            title="Registration"
                            text="Public registration is disabled. Existing employee access is administered internally."
                        />
                        <Rule
                            icon={GraduationCap}
                            title="Programs"
                            text="Program controls only appear for employees with Manage Programs permission."
                        />
                        <Rule
                            icon={Building2}
                            title="Campuses"
                            text="Campus controls only appear for employees with Manage Campuses permission."
                        />
                    </div>
                </section>

                <section id="reports" className="scroll-mt-32 space-y-4">
                    <SectionHeading
                        icon={FileDown}
                        title="Assigned inquiry reports"
                        description="Generate a filtered preview from the Assigned Inquiries section before downloading PDF."
                    />
                    <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
                        <div className="crm-panel p-5">
                            <h3 className="text-sm font-semibold">
                                Available filters
                            </h3>
                            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                <Feature
                                    icon={Building2}
                                    title="Campus"
                                    text="Include one active campus or all permitted campuses."
                                />
                                <Feature
                                    icon={Filter}
                                    title="Status"
                                    text="Include one inquiry status or all statuses."
                                />
                                <Feature
                                    icon={UsersRound}
                                    title="Assigned user"
                                    text="Available to Super Admin; regular users remain limited to themselves."
                                />
                                <Feature
                                    icon={CalendarClock}
                                    title="Date range"
                                    text="From and to dates both filter the inquiry updated_at value."
                                />
                            </div>
                        </div>
                        <div className="crm-panel p-5">
                            <h3 className="text-sm font-semibold">
                                Report behavior
                            </h3>
                            <ul className="mt-4 space-y-3">
                                <Check text="Today Report sets both dates to the current local date." />
                                <Check text="Preview shows total records and only status counts greater than zero." />
                                <Check text="The inquiry list includes contact, program, campus, user, status, department, and last update." />
                                <Check text="PDF download uses the same permission scope and filters as the preview." />
                            </ul>
                        </div>
                    </div>
                    <Callout title="Date behavior">
                        Dashboard table date filters use inquiry creation dates
                        (`created_at`). Follow-up queues use
                        `next_follow_up_at`. Report date filters use last
                        modification dates (`updated_at`) so the report
                        represents work performed during the period.
                    </Callout>
                </section>

                <section id="csv" className="scroll-mt-32 space-y-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <SectionHeading
                            icon={FileSpreadsheet}
                            title="CSV inquiry import"
                            description="Upload up to 500 rows, review the parsed table in a modal, then submit the import."
                        />
                        <Button asChild variant="outline">
                            <a href="/documentation/sample-inquiries-upload.csv">
                                <Download />
                                Download template
                            </a>
                        </Button>
                    </div>
                    <div className="crm-panel overflow-x-auto">
                        <table className="w-full min-w-[780px] text-sm">
                            <thead className="bg-muted text-muted-foreground">
                                <tr>
                                    <Th>Column</Th>
                                    <Th>Requirement</Th>
                                    <Th>Purpose</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {csvColumns.map(
                                    ([column, requirement, purpose]) => (
                                        <tr
                                            key={column}
                                            className="crm-table-row"
                                        >
                                            <Td>
                                                <code className="rounded bg-muted px-1.5 py-1 text-xs">
                                                    {column}
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
                                            <Td>{purpose}</Td>
                                        </tr>
                                    ),
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="grid gap-3 md:grid-cols-3">
                        <Rule
                            icon={Search}
                            title="Review first"
                            text="Rows are parsed into a review table. Check names, mappings, statuses, and dates before submit."
                        />
                        <Rule
                            icon={Building2}
                            title="Campus matching"
                            text="Campus values are matched by name. Inquiry selection is limited to active campuses."
                        />
                        <Rule
                            icon={GraduationCap}
                            title="Program matching"
                            text="Program names should match existing program records for reliable mapping."
                        />
                    </div>
                    <Callout title="Assignment is intentionally separate">
                        CSV imports never assign an employee. Every imported
                        inquiry enters the Dashboard as unassigned, then Super
                        Admin assigns or reassigns ownership from the table.
                    </Callout>
                    <Callout title="Manual inquiry ownership">
                        A regular employee is automatically selected as the
                        assignee when creating an inquiry, and their employee
                        department is locked onto the record. Super Admin can
                        choose another employee; that employee's department is
                        selected automatically and remains editable by Super
                        Admin.
                    </Callout>
                </section>

                <section id="rules" className="scroll-mt-32 space-y-4">
                    <SectionHeading
                        icon={LockKeyhole}
                        title="System rules and limitations"
                        description="Behaviors intentionally enforced to protect data integrity and access boundaries."
                    />
                    <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                        <div className="crm-panel divide-y">
                            <RuleRow title="Campus visibility">
                                Disabling a campus hides its inquiries from
                                dashboard lists and reports without deleting the
                                records.
                            </RuleRow>
                            <RuleRow title="Program deletion">
                                A program linked to any inquiry cannot be
                                deleted.
                            </RuleRow>
                            <RuleRow title="Campus deletion">
                                A campus linked to any inquiry cannot be
                                deleted; disable it instead.
                            </RuleRow>
                            <RuleRow title="Inquiry deletion">
                                Inquiry deletion, restore, and permanent
                                deletion are currently disabled.
                            </RuleRow>
                            <RuleRow title="Assigned user scope">
                                The Inquiries page always limits records to the
                                logged-in employee. Assignment is performed by
                                Super Admin, never by CSV import.
                            </RuleRow>
                            <RuleRow title="Postal invitation letter">
                                When Postal Communication is marked Sent, the
                                inquiry table and detail modal show a PDF icon
                                for downloading the formal university-style
                                invitation letter. Pending records cannot
                                generate the letter.
                            </RuleRow>
                            <RuleRow title="Authentication">
                                Users must be authenticated and email verified.
                                Public registration is unavailable.
                            </RuleRow>
                        </div>
                        <div className="crm-panel p-5">
                            <h3 className="text-sm font-semibold">
                                Supported inquiry statuses
                            </h3>
                            <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                Manual entry, CSV imports, filters, updates, and
                                reports use this shared status catalog.
                            </p>
                            <div className="mt-4 flex flex-wrap gap-2">
                                {statuses.map((status) => (
                                    <Badge
                                        key={status}
                                        variant="outline"
                                        className="capitalize"
                                    >
                                        {status}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </>
    );
}

function SectionHeading({
    icon: Icon,
    title,
    description,
}: {
    icon: typeof BookOpen;
    title: string;
    description: string;
}) {
    return (
        <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Icon className="size-4" />
            </span>
            <div>
                <h2 className="text-lg font-semibold">{title}</h2>
                <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
                    {description}
                </p>
            </div>
        </div>
    );
}

function Metric({
    label,
    value,
    note,
}: {
    label: string;
    value: string;
    note: string;
}) {
    return (
        <div className="crm-metric">
            <div className="text-xs font-medium text-muted-foreground uppercase">
                {label}
            </div>
            <div className="mt-1 text-2xl font-semibold">{value}</div>
            <div className="mt-1 text-xs text-muted-foreground">{note}</div>
        </div>
    );
}

function PurposeBlock({
    icon: Icon,
    title,
    text,
}: {
    icon: typeof History;
    title: string;
    text: string;
}) {
    return (
        <div className="border-b p-5 last:border-b-0 lg:border-r lg:border-b-0 lg:last:border-r-0">
            <Icon className="mb-3 size-5 text-primary" />
            <h3 className="text-sm font-semibold">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {text}
            </p>
        </div>
    );
}

function ModuleCard({
    title,
    icon: Icon,
    description,
    features,
}: (typeof modules)[number]) {
    return (
        <article className="bg-card p-5">
            <span className="mb-4 flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Icon className="size-4" />
            </span>
            <h3 className="text-sm font-semibold">{title}</h3>
            <p className="mt-2 min-h-24 text-sm leading-6 text-muted-foreground">
                {description}
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
                {features.map((feature) => (
                    <Badge key={feature} variant="secondary">
                        {feature}
                    </Badge>
                ))}
            </div>
        </article>
    );
}

function Feature({
    icon: Icon,
    title,
    text,
}: {
    icon: typeof Filter;
    title: string;
    text: string;
}) {
    return (
        <div className="flex gap-3">
            <Icon className="mt-0.5 size-4 shrink-0 text-primary" />
            <div>
                <div className="text-sm font-medium">{title}</div>
                <p className="mt-1 text-sm leading-5 text-muted-foreground">
                    {text}
                </p>
            </div>
        </div>
    );
}

function Rule({
    icon: Icon,
    title,
    text,
}: {
    icon: typeof ShieldCheck;
    title: string;
    text: string;
}) {
    return (
        <div className="crm-panel p-4">
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

function Check({ text }: { text: string }) {
    return (
        <li className="flex gap-2.5 text-sm leading-6 text-muted-foreground">
            <CheckCircle2 className="mt-1 size-4 shrink-0 text-primary" />
            <span>{text}</span>
        </li>
    );
}

function Callout({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <div className="text-sm font-semibold text-primary">{title}</div>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {children}
            </p>
        </div>
    );
}

function RuleRow({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div className="p-4 sm:grid sm:grid-cols-[10rem_1fr] sm:gap-4 sm:p-5">
            <h3 className="text-sm font-semibold">{title}</h3>
            <p className="mt-1 text-sm leading-6 text-muted-foreground sm:mt-0">
                {children}
            </p>
        </div>
    );
}

function QuickLink({
    href,
    icon: Icon,
    title,
    text,
    download = false,
}: {
    href: string;
    icon: typeof LayoutDashboard;
    title: string;
    text: string;
    download?: boolean;
}) {
    return (
        <a
            href={href}
            download={download || undefined}
            className="group crm-panel flex items-start gap-3 p-4 transition-colors hover:border-primary/30 hover:bg-muted/25"
        >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Icon className="size-4" />
            </span>
            <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-3 text-sm font-semibold">
                    {title}
                    <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                </span>
                <span className="mt-1 block text-sm leading-5 text-muted-foreground">
                    {text}
                </span>
            </span>
        </a>
    );
}

function WorkspaceGuide({
    icon: Icon,
    title,
    audience,
    points,
}: {
    icon: typeof LayoutDashboard;
    title: string;
    audience: string;
    points: string[];
}) {
    return (
        <article className="crm-panel p-5">
            <div className="flex items-start justify-between gap-4 border-b pb-4">
                <div className="flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <Icon className="size-4" />
                    </span>
                    <div>
                        <h3 className="text-sm font-semibold">{title}</h3>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            {audience}
                        </p>
                    </div>
                </div>
            </div>
            <ul className="mt-4 space-y-3">
                {points.map((point) => (
                    <Check key={point} text={point} />
                ))}
            </ul>
        </article>
    );
}

function QueueRow({
    name,
    rule,
    use,
}: {
    name: string;
    rule: string;
    use: string;
}) {
    return (
        <tr className="crm-table-row">
            <Td>
                <Badge variant="secondary">{name}</Badge>
            </Td>
            <Td>{rule}</Td>
            <Td>{use}</Td>
        </tr>
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
    breadcrumbs: [{ title: 'Project Documentation', href: '/documentation' }],
});
