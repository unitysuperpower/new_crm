import { Head } from '@inertiajs/react';
import {
    BookOpen,
    Building2,
    CalendarClock,
    Download,
    FileSpreadsheet,
    GraduationCap,
    MessageSquareText,
    ShieldCheck,
    UserRoundCog,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const modules = [
    {
        title: 'Employee',
        icon: UserRoundCog,
        description: 'Create employees, assign roles, and control permissions for CRM access.',
        items: ['Profile details', 'Roles', 'Permissions', 'Department'],
    },
    {
        title: 'Inquiry',
        icon: MessageSquareText,
        description: 'Manage student leads from first contact to assignment, follow-up, and status update.',
        items: ['Manual entry', 'CSV import', 'Assignment', 'Filters'],
    },
    {
        title: 'Stream',
        icon: CalendarClock,
        description: 'Keep discussion history under each inquiry so the team can continue work without confusion.',
        items: ['History', 'Employee notes', 'Last discussion', 'Follow-up'],
    },
    {
        title: 'Program',
        icon: GraduationCap,
        description: 'Create and manage academic programs used inside inquiry records.',
        items: ['Program name', 'Duration', 'Fee', 'Inquiry link'],
    },
    {
        title: 'Campus',
        icon: Building2,
        description: 'Manage campuses and control whether campus inquiry records are visible in the dashboard.',
        items: ['CRUD', 'Visibility toggle', 'Campus filter', 'CSV matching'],
    },
];

const workflow = [
    'Super Admin creates employees and assigns role permissions.',
    'Programs and campuses are managed before inquiry work starts.',
    'Inquiries are created manually or imported through CSV review.',
    'Super Admin assigns or reassigns inquiries to users.',
    'Assigned users update status, department, next follow-up, and stream notes.',
    'Permitted users can view details and submit stream discussion history.',
];

export default function DocumentationIndex() {
    return (
        <>
            <Head title="Project Documentation" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div>
                    <div className="mb-2 inline-flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm font-medium">
                        <BookOpen className="text-muted-foreground size-4" />
                        Project documentation
                    </div>
                    <h1 className="text-xl font-semibold">Aurea Education CRM</h1>
                    <p className="text-muted-foreground text-sm">
                        Functional guide for employees, inquiries, streams, programs, campuses, permissions, and CSV workflow.
                    </p>
                </div>

                <div className="grid gap-3 md:grid-cols-4">
                    <Metric label="Core modules" value="5" />
                    <Metric label="Roles" value="3" />
                    <Metric label="Import" value="CSV" />
                    <Metric label="Access" value="Permission" />
                </div>

                <section className="rounded-lg border bg-background p-4">
                    <div className="mb-4 flex items-start gap-3">
                        <div className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-md">
                            <ShieldCheck className="text-muted-foreground size-5" />
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold">Project Purpose</h2>
                            <p className="text-muted-foreground text-sm leading-6">
                                This CRM helps education teams manage student inquiries, assign follow-up work,
                                record discussion streams, and keep program and campus data organized.
                            </p>
                        </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-3">
                        <InfoBlock title="Super Admin" text="Controls users, permissions, programs, campuses, and inquiry assignment." />
                        <InfoBlock title="Admin" text="Works across inquiries, imports, programs, and campuses according to assigned permissions." />
                        <InfoBlock title="User" text="Creates inquiries, views records, updates assigned inquiries, and submits stream notes." />
                    </div>
                </section>

                <section className="grid gap-3 xl:grid-cols-5">
                    {modules.map((module) => (
                        <ModuleCard key={module.title} {...module} />
                    ))}
                </section>

                <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
                    <div className="rounded-lg border bg-background p-4">
                        <div className="mb-4 flex items-center gap-2">
                            <MessageSquareText className="text-muted-foreground size-4" />
                            <h2 className="text-sm font-semibold">Inquiry Workflow</h2>
                        </div>
                        <ol className="space-y-3">
                            {workflow.map((item, index) => (
                                <li key={item} className="flex gap-3 text-sm">
                                    <span className="bg-muted flex size-6 shrink-0 items-center justify-center rounded-md text-xs font-semibold">
                                        {index + 1}
                                    </span>
                                    <span className="text-muted-foreground">{item}</span>
                                </li>
                            ))}
                        </ol>
                    </div>

                    <div className="rounded-lg border bg-background p-4">
                        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-2">
                                <FileSpreadsheet className="text-muted-foreground size-4" />
                                <h2 className="text-sm font-semibold">CSV And Future Files</h2>
                            </div>
                            <Button asChild variant="outline" size="sm">
                                <a href="/documentation/sample-inquiries-upload.csv">
                                    <Download />
                                    Download sample CSV
                                </a>
                            </Button>
                        </div>
                        <div className="grid gap-3">
                            <InfoBlock title="CSV review" text="Inquiry uploads are reviewed in a table before final submit." />
                            <InfoBlock title="Campus and source" text="CSV rows support campus, source, previous program, and follow-up data." />
                            <InfoBlock title="Future docs" text="More import templates and process documents can be added here later." />
                        </div>
                    </div>
                </section>
            </div>
        </>
    );
}

function Metric({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-lg border bg-background p-4">
            <div className="text-muted-foreground text-sm">{label}</div>
            <div className="mt-1 text-2xl font-semibold">{value}</div>
        </div>
    );
}

function InfoBlock({ title, text }: { title: string; text: string }) {
    return (
        <div className="rounded-md border bg-muted/20 p-3">
            <div className="text-sm font-semibold">{title}</div>
            <p className="text-muted-foreground mt-1 text-sm leading-6">{text}</p>
        </div>
    );
}

function ModuleCard({
    title,
    icon: Icon,
    description,
    items,
}: {
    title: string;
    icon: typeof UserRoundCog;
    description: string;
    items: string[];
}) {
    return (
        <div className="rounded-lg border bg-background p-4">
            <div className="mb-3 flex items-center gap-2">
                <Icon className="text-muted-foreground size-4" />
                <h2 className="text-sm font-semibold">{title}</h2>
            </div>
            <p className="text-muted-foreground min-h-16 text-sm leading-6">{description}</p>
            <div className="mt-3 flex flex-wrap gap-2">
                {items.map((item) => (
                    <Badge key={item} variant="secondary">
                        {item}
                    </Badge>
                ))}
            </div>
        </div>
    );
}

DocumentationIndex.layout = () => ({
    breadcrumbs: [
        {
            title: 'Project Documentation',
            href: '/documentation',
        },
    ],
});
