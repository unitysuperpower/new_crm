import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    Building2,
    CalendarClock,
    Eye,
    FileDown,
    FileText,
    FileSpreadsheet,
    Filter,
    MessageSquarePlus,
    Power,
    PowerOff,
    Plus,
    Search,
    Send,
    Upload,
    UserCheck,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

type Option = { id: number; name: string };
type CampusOption = Option & { is_active: boolean };
type Stream = {
    id: number;
    response: string;
    user: Option | null;
    created_at: string;
};
type Inquiry = {
    id: number;
    name: string;
    phone: string;
    email: string | null;
    city: string | null;
    address: string | null;
    source: string | null;
    program_id: number | null;
    program: Option | null;
    previous_program: string | null;
    campus_id: number | null;
    campus_model: Option | null;
    campus: string | null;
    status: string;
    assigned_user_id: number | null;
    assigned_user: Option | null;
    department: string;
    next_follow_up_at: string | null;
    message: string | null;
    can_update: boolean;
    created_at: string;
    streams: Stream[];
};
type InquiryForm = {
    name: string;
    phone: string;
    email: string;
    city: string;
    address: string;
    source: string;
    program_id: string;
    previous_program: string;
    campus_id: string;
    campus: string;
    status: string;
    assigned_user_id: string;
    department: string;
    next_follow_up_at: string;
    message: string;
};
type ReportFilters = {
    campus_id: string;
    status: string;
    assigned_user_id: string;
    date_from: string;
    date_to: string;
};
type ReportInquiry = {
    id: number;
    name: string;
    phone: string;
    email: string | null;
    program: string | null;
    campus: string | null;
    assigned_user: string | null;
    status: string;
    department: string;
    updated_at: string;
};
type InquiryReport = {
    generatedAt: string;
    filters: {
        campus: string | null;
        status: string | null;
        user: string | null;
        dateFrom: string | null;
        dateTo: string | null;
    };
    statusCounts: Record<string, number>;
    total: number;
    inquiries: ReportInquiry[];
};

const emptyInquiry: InquiryForm = {
    name: '',
    phone: '',
    email: '',
    city: '',
    address: '',
    source: '',
    program_id: '',
    previous_program: '',
    campus_id: '',
    campus: '',
    status: 'pending',
    assigned_user_id: '',
    department: 'admission',
    next_follow_up_at: '',
    message: '',
};

const emptyReportFilters: ReportFilters = {
    campus_id: '',
    status: '',
    assigned_user_id: '',
    date_from: '',
    date_to: '',
};

export default function Dashboard({
    pageTitle,
    pageUrl,
    pageMode,
    filters,
    inquiries,
    pagination,
    programs,
    campuses,
    teamMembers,
    sourceOptions,
    statusOptions,
    departmentOptions,
    crmPermissions,
}: {
    pageTitle: string;
    pageUrl: string;
    pageMode: 'all' | 'assigned';
    filters: Record<string, string>;
    inquiries: Inquiry[];
    pagination: {
        current_page: number;
        from: number | null;
        last_page: number;
        next_page_url: string | null;
        per_page: number;
        prev_page_url: string | null;
        to: number | null;
        total: number;
    };
    programs: Option[];
    campuses: CampusOption[];
    teamMembers: Option[];
    sourceOptions: string[];
    statusOptions: string[];
    departmentOptions: string[];
    crmPermissions: {
        canCreateInquiry: boolean;
        canImportInquiry: boolean;
        canAssignInquiry: boolean;
        canManageCampus: boolean;
    };
}) {
    const csvInputRef = useRef<HTMLInputElement>(null);
    const [filterForm, setFilterForm] = useState(filters);
    const [createOpen, setCreateOpen] = useState(false);
    const [importOpen, setImportOpen] = useState(false);
    const [detailOpen, setDetailOpen] = useState(false);
    const [selected, setSelected] = useState<Inquiry | null>(null);
    const [newInquiry, setNewInquiry] = useState<InquiryForm>(emptyInquiry);
    const [importRows, setImportRows] = useState<InquiryForm[]>([]);
    const [streamText, setStreamText] = useState('');
    const [activeHistory, setActiveHistory] = useState('all');
    const [selectedInquiryIds, setSelectedInquiryIds] = useState<number[]>([]);
    const [bulkAssignedUserId, setBulkAssignedUserId] = useState('');
    const [expandedDiscussionIds, setExpandedDiscussionIds] = useState<
        number[]
    >([]);
    const [togglingCampusIds, setTogglingCampusIds] = useState<number[]>([]);
    const [reportFilterOpen, setReportFilterOpen] = useState(false);
    const [reportPreviewOpen, setReportPreviewOpen] = useState(false);
    const [reportFilters, setReportFilters] =
        useState<ReportFilters>(emptyReportFilters);
    const [report, setReport] = useState<InquiryReport | null>(null);
    const [reportLoading, setReportLoading] = useState(false);
    const [reportError, setReportError] = useState('');

    const activeCampuses = useMemo(
        () => campuses.filter((campus) => campus.is_active),
        [campuses],
    );

    const selectedUserTabs = useMemo(() => {
        const users = new Map<string, string>();
        selected?.streams.forEach((stream) => {
            if (stream.user)
                users.set(String(stream.user.id), stream.user.name);
        });

        return [...users.entries()];
    }, [selected]);

    const visibleStreams =
        activeHistory === 'all'
            ? (selected?.streams ?? [])
            : (selected?.streams.filter(
                  (stream) => String(stream.user?.id) === activeHistory,
              ) ?? []);

    const allVisibleSelected =
        inquiries.length > 0 &&
        inquiries.every((inquiry) => selectedInquiryIds.includes(inquiry.id));

    useEffect(() => {
        if (!selected) return;

        setSelected(
            inquiries.find((inquiry) => inquiry.id === selected.id) ?? selected,
        );
    }, [inquiries, selected]);

    useEffect(() => {
        const visibleIds = new Set(inquiries.map((inquiry) => inquiry.id));
        setSelectedInquiryIds((current) =>
            current.filter((id) => visibleIds.has(id)),
        );
    }, [inquiries]);

    const submitFilters = (event: FormEvent) => {
        event.preventDefault();
        router.get(pageUrl, cleanPayload(filterForm), {
            preserveState: true,
            replace: true,
        });
    };

    const submitInquiry = (event: FormEvent) => {
        event.preventDefault();
        router.post('/inquiries', normalizeInquiry(newInquiry), {
            onSuccess: () => {
                setCreateOpen(false);
                setNewInquiry(emptyInquiry);
            },
        });
    };

    const submitImport = () => {
        router.post(
            '/inquiries/import',
            { rows: importRows.map(normalizeInquiry) },
            {
                onSuccess: () => {
                    setImportOpen(false);
                    setImportRows([]);
                    if (csvInputRef.current) csvInputRef.current.value = '';
                },
            },
        );
    };

    const assignSelectedInquiries = () => {
        if (!bulkAssignedUserId || selectedInquiryIds.length === 0) return;

        router.patch(
            '/inquiries/assign',
            {
                inquiry_ids: selectedInquiryIds,
                assigned_user_id: bulkAssignedUserId,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setSelectedInquiryIds([]);
                    setBulkAssignedUserId('');
                },
            },
        );
    };

    const toggleSelectedInquiry = (inquiryId: number, checked: boolean) => {
        setSelectedInquiryIds((current) =>
            checked
                ? [...new Set([...current, inquiryId])]
                : current.filter((id) => id !== inquiryId),
        );
    };

    const toggleAllVisibleInquiries = (checked: boolean) => {
        setSelectedInquiryIds(
            checked ? inquiries.map((inquiry) => inquiry.id) : [],
        );
    };

    const toggleDiscussion = (inquiryId: number) => {
        setExpandedDiscussionIds((current) =>
            current.includes(inquiryId)
                ? current.filter((id) => id !== inquiryId)
                : [...current, inquiryId],
        );
    };

    const updateInquiry = (event: FormEvent) => {
        event.preventDefault();
        if (!selected) return;

        router.patch(
            `/inquiries/${selected.id}`,
            {
                status: selected.status,
                department: selected.department,
                next_follow_up_at: selected.next_follow_up_at ?? '',
            },
            { preserveScroll: true },
        );
    };

    const submitStream = (event: FormEvent) => {
        event.preventDefault();
        if (!selected || !streamText.trim()) return;

        router.post(
            `/inquiries/${selected.id}/streams`,
            { response: streamText },
            {
                preserveScroll: true,
                onSuccess: () => setStreamText(''),
            },
        );
    };

    const openDetail = (inquiry: Inquiry) => {
        setSelected(inquiry);
        setActiveHistory('all');
        setDetailOpen(true);
    };

    const handleCsv = async (file?: File) => {
        if (!file) return;

        const rows = parseCsv(await file.text())
            .map((row) =>
                csvRowToInquiry(row, programs, activeCampuses, teamMembers),
            )
            .filter((row) => row.name || row.phone || row.email);

        setImportRows(rows);
        setImportOpen(true);
    };

    const toggleCampus = (campus: CampusOption) => {
        if (!crmPermissions.canManageCampus) return;

        setTogglingCampusIds((current) => [
            ...new Set([...current, campus.id]),
        ]);
        router.patch(
            `/campuses/${campus.id}/toggle`,
            { is_active: !campus.is_active },
            {
                preserveScroll: true,
                preserveState: true,
                onFinish: () => {
                    setTogglingCampusIds((current) =>
                        current.filter((id) => id !== campus.id),
                    );
                },
            },
        );
    };

    const setTodayReport = () => {
        const today = formatLocalDate(new Date());
        setReportFilters((current) => ({
            ...current,
            date_from: today,
            date_to: today,
        }));
    };

    const generateReport = async (event: FormEvent) => {
        event.preventDefault();
        setReportLoading(true);
        setReportError('');

        try {
            const response = await fetch(
                `/inquiries/report?${reportQuery(reportFilters)}`,
                {
                    headers: { Accept: 'application/json' },
                },
            );

            if (!response.ok)
                throw new Error(
                    'Unable to generate the report. Check the selected dates and try again.',
                );

            setReport((await response.json()) as InquiryReport);
            setReportFilterOpen(false);
            setReportPreviewOpen(true);
        } catch (error) {
            setReportError(
                error instanceof Error
                    ? error.message
                    : 'Unable to generate the report.',
            );
        } finally {
            setReportLoading(false);
        }
    };

    return (
        <>
            <Head title={pageTitle} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-xl font-semibold">{pageTitle}</h1>
                        <p className="text-sm text-muted-foreground">
                            Review, filter, assign, and follow up on inquiries.
                        </p>
                    </div>
                </div>

                <div className="grid gap-3 md:grid-cols-4">
                    <Metric label="Total inquiries" value={pagination.total} />
                    <Metric
                        label="Pending"
                        value={
                            inquiries.filter(
                                (item) => item.status === 'pending',
                            ).length
                        }
                    />
                    <Metric
                        label="Follow ups"
                        value={
                            inquiries.filter((item) => item.next_follow_up_at)
                                .length
                        }
                    />
                    <Metric
                        label="My assigned"
                        value={
                            inquiries.filter((item) => item.can_update).length
                        }
                    />
                </div>

                <div className="rounded-lg border bg-background p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-sm font-semibold">
                                {pageMode === 'assigned'
                                    ? 'Assigned inquiries'
                                    : 'All inquiries'}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                {pageMode === 'assigned'
                                    ? 'This page only shows inquiries assigned to your user.'
                                    : 'Dashboard overview shows all visible inquiries.'}
                            </p>
                        </div>
                        {pageMode === 'assigned' && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setReportFilterOpen(true)}
                            >
                                <FileText />
                                Generate report
                            </Button>
                        )}
                    </div>
                </div>

                {crmPermissions.canManageCampus && (
                    <div className="rounded-lg border bg-background p-4">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex items-start gap-3">
                                <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted">
                                    <Building2 className="size-5 text-muted-foreground" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-semibold">
                                        Campus visibility
                                    </h2>
                                    <p className="text-sm text-muted-foreground">
                                        Hidden campuses stay saved, but their
                                        inquiries are removed from this list.
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {campuses.map((campus) => (
                                    <button
                                        key={campus.id}
                                        type="button"
                                        aria-pressed={campus.is_active}
                                        disabled={togglingCampusIds.includes(
                                            campus.id,
                                        )}
                                        className={[
                                            'inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium transition',
                                            campus.is_active
                                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300'
                                                : 'border-muted bg-muted/40 text-muted-foreground hover:bg-muted',
                                            togglingCampusIds.includes(
                                                campus.id,
                                            )
                                                ? 'cursor-wait opacity-60'
                                                : '',
                                        ].join(' ')}
                                        onClick={() => toggleCampus(campus)}
                                    >
                                        {campus.is_active ? (
                                            <Power className="size-4" />
                                        ) : (
                                            <PowerOff className="size-4" />
                                        )}
                                        <span>{campus.name}</span>
                                    </button>
                                ))}
                                {campuses.length === 0 && (
                                    <span className="text-sm text-muted-foreground">
                                        No campuses created yet.
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <div className="rounded-lg border bg-background">
                    <div className="space-y-3 border-b p-4">
                        <form className="space-y-3" onSubmit={submitFilters}>
                            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                                <div className="relative w-full lg:max-w-2xl">
                                    <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        className="h-11 pl-9 text-base md:text-sm"
                                        placeholder="Search name, phone, email, city, campus, source"
                                        value={filterForm.search ?? ''}
                                        onChange={(event) =>
                                            setFilterForm({
                                                ...filterForm,
                                                search: event.target.value,
                                            })
                                        }
                                    />
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <Button type="submit" variant="outline">
                                        <Search />
                                        Search
                                    </Button>
                                    {crmPermissions.canImportInquiry && (
                                        <>
                                            <input
                                                ref={csvInputRef}
                                                className="hidden"
                                                type="file"
                                                accept=".csv,text/csv"
                                                onChange={(event) =>
                                                    void handleCsv(
                                                        event.target.files?.[0],
                                                    )
                                                }
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() =>
                                                    csvInputRef.current?.click()
                                                }
                                            >
                                                <Upload />
                                                CSV
                                            </Button>
                                        </>
                                    )}

                                    <Button
                                        type="button"
                                        onClick={() => setCreateOpen(true)}
                                    >
                                        <Plus />
                                        Add
                                    </Button>
                                </div>
                            </div>

                            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1.1fr_1fr_1fr_0.9fr_0.9fr_auto]">
                                <FilterSelect
                                    placeholder="Status"
                                    value={filterForm.status ?? ''}
                                    options={statusOptions}
                                    onChange={(status) =>
                                        setFilterForm({ ...filterForm, status })
                                    }
                                />
                                <FilterSelect
                                    placeholder="Department"
                                    value={filterForm.department ?? ''}
                                    options={departmentOptions}
                                    onChange={(department) =>
                                        setFilterForm({
                                            ...filterForm,
                                            department,
                                        })
                                    }
                                />
                                {pageMode === 'all' && (
                                    <Select
                                        value={
                                            filterForm.assigned_user_id || 'all'
                                        }
                                        onValueChange={(value) =>
                                            setFilterForm({
                                                ...filterForm,
                                                assigned_user_id:
                                                    value === 'all'
                                                        ? ''
                                                        : value,
                                            })
                                        }
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Assigned user" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                All users
                                            </SelectItem>
                                            {teamMembers.map((member) => (
                                                <SelectItem
                                                    key={member.id}
                                                    value={String(member.id)}
                                                >
                                                    {member.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                                <FilterSelect
                                    placeholder="Source"
                                    value={filterForm.source ?? ''}
                                    options={sourceOptions}
                                    onChange={(source) =>
                                        setFilterForm({ ...filterForm, source })
                                    }
                                />
                                <Select
                                    value={filterForm.campus_id || 'all'}
                                    onValueChange={(value) =>
                                        setFilterForm({
                                            ...filterForm,
                                            campus_id:
                                                value === 'all' ? '' : value,
                                        })
                                    }
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Campus" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            All campus
                                        </SelectItem>
                                        {activeCampuses.map((campus) => (
                                            <SelectItem
                                                key={campus.id}
                                                value={String(campus.id)}
                                            >
                                                {campus.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Input
                                    type="date"
                                    aria-label="From date"
                                    value={filterForm.date_from ?? ''}
                                    onChange={(event) =>
                                        setFilterForm({
                                            ...filterForm,
                                            date_from: event.target.value,
                                        })
                                    }
                                />
                                <Input
                                    type="date"
                                    aria-label="To date"
                                    value={filterForm.date_to ?? ''}
                                    onChange={(event) =>
                                        setFilterForm({
                                            ...filterForm,
                                            date_to: event.target.value,
                                        })
                                    }
                                />
                                <Button type="submit" variant="secondary">
                                    <Filter />
                                    Apply
                                </Button>
                            </div>
                        </form>
                    </div>

                    {crmPermissions.canAssignInquiry && (
                        <div className="flex flex-col gap-2 border-b bg-muted/20 p-4 md:flex-row md:items-center">
                            <div className="text-sm text-muted-foreground">
                                {selectedInquiryIds.length} selected
                            </div>
                            <Select
                                value={bulkAssignedUserId || 'none'}
                                onValueChange={(value) =>
                                    setBulkAssignedUserId(
                                        value === 'none' ? '' : value,
                                    )
                                }
                            >
                                <SelectTrigger className="w-full md:w-64">
                                    <SelectValue placeholder="Assign to user" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">
                                        Select user
                                    </SelectItem>
                                    {teamMembers.map((member) => (
                                        <SelectItem
                                            key={member.id}
                                            value={String(member.id)}
                                        >
                                            {member.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button
                                type="button"
                                disabled={
                                    selectedInquiryIds.length === 0 ||
                                    !bulkAssignedUserId
                                }
                                onClick={assignSelectedInquiries}
                            >
                                <UserCheck />
                                Assign
                            </Button>
                        </div>
                    )}

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1180px] text-sm">
                            <thead className="bg-muted/60 text-muted-foreground">
                                <tr>
                                    {crmPermissions.canAssignInquiry && (
                                        <Th>
                                            <Checkbox
                                                checked={allVisibleSelected}
                                                aria-label="Select all inquiries"
                                                onCheckedChange={(checked) =>
                                                    toggleAllVisibleInquiries(
                                                        checked === true,
                                                    )
                                                }
                                            />
                                        </Th>
                                    )}
                                    <Th>Action</Th>
                                    <Th>Name</Th>
                                    <Th>Source</Th>
                                    <Th>Program</Th>
                                    <Th>Previous program</Th>
                                    <Th>Campus</Th>
                                    <Th>Assigned</Th>
                                    <Th>Status</Th>
                                    <Th>Department</Th>
                                    <Th>Follow up</Th>
                                    <Th>Last discussion</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {inquiries.map((inquiry) => (
                                    <tr key={inquiry.id} className="border-t">
                                        {crmPermissions.canAssignInquiry && (
                                            <Td>
                                                <Checkbox
                                                    checked={selectedInquiryIds.includes(
                                                        inquiry.id,
                                                    )}
                                                    aria-label={`Select ${inquiry.name}`}
                                                    onCheckedChange={(
                                                        checked,
                                                    ) =>
                                                        toggleSelectedInquiry(
                                                            inquiry.id,
                                                            checked === true,
                                                        )
                                                    }
                                                />
                                            </Td>
                                        )}
                                        <Td>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                    openDetail(inquiry)
                                                }
                                            >
                                                <Eye />
                                                View
                                            </Button>
                                        </Td>
                                        <Td>
                                            <div className="font-medium">
                                                {inquiry.name}
                                            </div>
                                            <div className="text-muted-foreground">
                                                {inquiry.phone}
                                            </div>
                                            {inquiry.email && (
                                                <div className="text-muted-foreground">
                                                    {inquiry.email}
                                                </div>
                                            )}
                                        </Td>
                                        <Td>{inquiry.source || 'Not set'}</Td>
                                        <Td>
                                            {inquiry.program?.name ??
                                                'No program'}
                                        </Td>
                                        <Td>
                                            {inquiry.previous_program ||
                                                'Not set'}
                                        </Td>
                                        <Td>
                                            {inquiry.campus_model?.name ??
                                                inquiry.campus ??
                                                'Not set'}
                                        </Td>
                                        <Td>
                                            {inquiry.assigned_user?.name ??
                                                'Unassigned'}
                                        </Td>
                                        <Td>
                                            <Badge
                                                variant={
                                                    inquiry.status === 'pending'
                                                        ? 'secondary'
                                                        : 'outline'
                                                }
                                            >
                                                {inquiry.status}
                                            </Badge>
                                        </Td>
                                        <Td>{inquiry.department}</Td>
                                        <Td>
                                            <span className="inline-flex items-center gap-1">
                                                <CalendarClock className="size-4 text-muted-foreground" />
                                                {inquiry.next_follow_up_at ??
                                                    'Not set'}
                                            </span>
                                        </Td>
                                        <Td className="max-w-[300px]">
                                            <LastDiscussion
                                                text={
                                                    inquiry.streams[0]
                                                        ?.response ??
                                                    inquiry.message ??
                                                    'No discussion yet'
                                                }
                                                expanded={expandedDiscussionIds.includes(
                                                    inquiry.id,
                                                )}
                                                onToggle={() =>
                                                    toggleDiscussion(inquiry.id)
                                                }
                                            />
                                        </Td>
                                    </tr>
                                ))}
                                {inquiries.length === 0 && (
                                    <tr>
                                        <td
                                            className="p-8 text-center text-muted-foreground"
                                            colSpan={
                                                crmPermissions.canAssignInquiry
                                                    ? 12
                                                    : 11
                                            }
                                        >
                                            No inquiries found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <PaginationControls pagination={pagination} />
                </div>
            </div>

            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Add inquiry</DialogTitle>
                        <DialogDescription>
                            Manual inquiries use the same fields as CSV imports.
                        </DialogDescription>
                    </DialogHeader>
                    <InquiryFormFields
                        form={newInquiry}
                        programs={programs}
                        campuses={activeCampuses}
                        teamMembers={teamMembers}
                        statusOptions={statusOptions}
                        departmentOptions={departmentOptions}
                        onChange={setNewInquiry}
                        onSubmit={submitInquiry}
                    />
                </DialogContent>
            </Dialog>

            <Dialog open={reportFilterOpen} onOpenChange={setReportFilterOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            Generate assigned inquiry report
                        </DialogTitle>
                        <DialogDescription>
                            Filter by the inquiry last updated date. Leave a
                            field empty to include all permitted records.
                        </DialogDescription>
                    </DialogHeader>
                    <form className="space-y-4" onSubmit={generateReport}>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <ReportField label="Campus">
                                <Select
                                    value={reportFilters.campus_id || 'all'}
                                    onValueChange={(value) =>
                                        setReportFilters({
                                            ...reportFilters,
                                            campus_id:
                                                value === 'all' ? '' : value,
                                        })
                                    }
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="All campuses" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            All campuses
                                        </SelectItem>
                                        {activeCampuses.map((campus) => (
                                            <SelectItem
                                                key={campus.id}
                                                value={String(campus.id)}
                                            >
                                                {campus.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </ReportField>
                            <ReportField label="Status">
                                <Select
                                    value={reportFilters.status || 'all'}
                                    onValueChange={(value) =>
                                        setReportFilters({
                                            ...reportFilters,
                                            status:
                                                value === 'all' ? '' : value,
                                        })
                                    }
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="All statuses" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            All statuses
                                        </SelectItem>
                                        {statusOptions.map((status) => (
                                            <SelectItem
                                                key={status}
                                                value={status}
                                            >
                                                {status}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </ReportField>
                            {crmPermissions.canAssignInquiry && (
                                <ReportField label="Assigned user">
                                    <Select
                                        value={
                                            reportFilters.assigned_user_id ||
                                            'all'
                                        }
                                        onValueChange={(value) =>
                                            setReportFilters({
                                                ...reportFilters,
                                                assigned_user_id:
                                                    value === 'all'
                                                        ? ''
                                                        : value,
                                            })
                                        }
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="All users" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                All users
                                            </SelectItem>
                                            {teamMembers.map((member) => (
                                                <SelectItem
                                                    key={member.id}
                                                    value={String(member.id)}
                                                >
                                                    {member.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </ReportField>
                            )}
                            <ReportField label="From updated date">
                                <Input
                                    type="date"
                                    value={reportFilters.date_from}
                                    onChange={(event) =>
                                        setReportFilters({
                                            ...reportFilters,
                                            date_from: event.target.value,
                                        })
                                    }
                                />
                            </ReportField>
                            <ReportField label="To updated date">
                                <Input
                                    type="date"
                                    min={reportFilters.date_from || undefined}
                                    value={reportFilters.date_to}
                                    onChange={(event) =>
                                        setReportFilters({
                                            ...reportFilters,
                                            date_to: event.target.value,
                                        })
                                    }
                                />
                            </ReportField>
                        </div>
                        {reportError && (
                            <p className="text-sm text-destructive">
                                {reportError}
                            </p>
                        )}
                        <DialogFooter className="gap-2 sm:justify-between">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={setTodayReport}
                            >
                                <CalendarClock />
                                Today report
                            </Button>
                            <Button type="submit" disabled={reportLoading}>
                                <FileText />
                                {reportLoading
                                    ? 'Generating...'
                                    : 'Generate preview'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog
                open={reportPreviewOpen}
                onOpenChange={setReportPreviewOpen}
            >
                <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-7xl">
                    <DialogHeader>
                        <DialogTitle>Assigned inquiries report</DialogTitle>
                        <DialogDescription>
                            {report
                                ? `${report.total} inquiries generated ${report.generatedAt}. Dates use updated_at.`
                                : ''}
                        </DialogDescription>
                    </DialogHeader>
                    {report && (
                        <div className="space-y-4">
                            <div className="flex flex-wrap gap-2">
                                <Metric label="Total" value={report.total} />
                                {Object.entries(report.statusCounts)
                                    .filter(([, count]) => count > 0)
                                    .map(([status, count]) => (
                                        <Metric
                                            key={status}
                                            label={status}
                                            value={count}
                                        />
                                    ))}
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                <span>
                                    Campus: {report.filters.campus ?? 'All'}
                                </span>
                                <span>
                                    Status: {report.filters.status ?? 'All'}
                                </span>
                                <span>
                                    User:{' '}
                                    {report.filters.user ??
                                        'All permitted users'}
                                </span>
                                <span>
                                    Date: {report.filters.dateFrom ?? 'Any'} to{' '}
                                    {report.filters.dateTo ?? 'Any'}
                                </span>
                            </div>
                            <div className="overflow-x-auto rounded-md border">
                                <table className="w-full min-w-[1050px] text-sm">
                                    <thead className="bg-muted/60 text-muted-foreground">
                                        <tr>
                                            <Th>ID</Th>
                                            <Th>Student</Th>
                                            <Th>Program</Th>
                                            <Th>Campus</Th>
                                            <Th>Assigned user</Th>
                                            <Th>Status</Th>
                                            <Th>Department</Th>
                                            <Th>Last updated</Th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {report.inquiries.map((inquiry) => (
                                            <tr
                                                key={inquiry.id}
                                                className="border-t"
                                            >
                                                <Td>{inquiry.id}</Td>
                                                <Td>
                                                    <div className="font-medium">
                                                        {inquiry.name}
                                                    </div>
                                                    <div className="text-muted-foreground">
                                                        {inquiry.phone}
                                                    </div>
                                                    {inquiry.email && (
                                                        <div className="text-muted-foreground">
                                                            {inquiry.email}
                                                        </div>
                                                    )}
                                                </Td>
                                                <Td>
                                                    {inquiry.program ??
                                                        'Not set'}
                                                </Td>
                                                <Td>
                                                    {inquiry.campus ??
                                                        'Not set'}
                                                </Td>
                                                <Td>
                                                    {inquiry.assigned_user ??
                                                        'Unassigned'}
                                                </Td>
                                                <Td>
                                                    <Badge variant="outline">
                                                        {inquiry.status}
                                                    </Badge>
                                                </Td>
                                                <Td>{inquiry.department}</Td>
                                                <Td>{inquiry.updated_at}</Td>
                                            </tr>
                                        ))}
                                        {report.inquiries.length === 0 && (
                                            <tr>
                                                <td
                                                    className="p-8 text-center text-muted-foreground"
                                                    colSpan={8}
                                                >
                                                    No inquiries match these
                                                    report filters.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setReportPreviewOpen(false);
                                        setReportFilterOpen(true);
                                    }}
                                >
                                    <Filter />
                                    Change filters
                                </Button>
                                <Button
                                    type="button"
                                    disabled={report.total === 0}
                                    onClick={() => {
                                        window.location.href = `/inquiries/report/pdf?${reportQuery(reportFilters)}`;
                                    }}
                                >
                                    <FileDown />
                                    Download PDF
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={importOpen} onOpenChange={setImportOpen}>
                <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-6xl">
                    <DialogHeader>
                        <DialogTitle>Review CSV import</DialogTitle>
                        <DialogDescription>
                            Check the table before submitting inquiries to the
                            dashboard.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="overflow-x-auto rounded-md border">
                        <table className="w-full min-w-[1100px] text-sm">
                            <thead className="bg-muted/60">
                                <tr>
                                    {[
                                        'Name',
                                        'Phone',
                                        'Email',
                                        'Source',
                                        'Program',
                                        'Previous program',
                                        'Campus',
                                        'Assigned',
                                        'Status',
                                        'Department',
                                        'Follow up',
                                    ].map((heading) => (
                                        <Th key={heading}>{heading}</Th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {importRows.map((row, index) => (
                                    <tr
                                        key={`${row.email}-${index}`}
                                        className="border-t"
                                    >
                                        <Td>{row.name}</Td>
                                        <Td>{row.phone}</Td>
                                        <Td>{row.email}</Td>
                                        <Td>{row.source}</Td>
                                        <Td>
                                            {
                                                programs.find(
                                                    (program) =>
                                                        String(program.id) ===
                                                        row.program_id,
                                                )?.name
                                            }
                                        </Td>
                                        <Td>{row.previous_program}</Td>
                                        <Td>
                                            {activeCampuses.find(
                                                (campus) =>
                                                    String(campus.id) ===
                                                    row.campus_id,
                                            )?.name ?? row.campus}
                                        </Td>
                                        <Td>
                                            {
                                                teamMembers.find(
                                                    (member) =>
                                                        String(member.id) ===
                                                        row.assigned_user_id,
                                                )?.name
                                            }
                                        </Td>
                                        <Td>{row.status}</Td>
                                        <Td>{row.department}</Td>
                                        <Td>{row.next_follow_up_at}</Td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setImportOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            disabled={importRows.length === 0}
                            onClick={submitImport}
                        >
                            <FileSpreadsheet />
                            Submit {importRows.length} rows
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
                <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
                    {selected && (
                        <>
                            <DialogHeader>
                                <DialogTitle>{selected.name}</DialogTitle>
                                <DialogDescription>
                                    {selected.phone} ·{' '}
                                    {selected.email ?? 'No email'} ·{' '}
                                    {selected.city ?? 'No city'}
                                </DialogDescription>
                            </DialogHeader>

                            <form
                                className="grid gap-3 md:grid-cols-3"
                                onSubmit={updateInquiry}
                            >
                                <FilterSelect
                                    placeholder="Status"
                                    value={selected.status}
                                    options={statusOptions}
                                    disabled={!selected.can_update}
                                    onChange={(status) =>
                                        setSelected({ ...selected, status })
                                    }
                                />
                                <FilterSelect
                                    placeholder="Department"
                                    value={selected.department}
                                    options={departmentOptions}
                                    disabled={!selected.can_update}
                                    onChange={(department) =>
                                        setSelected({ ...selected, department })
                                    }
                                />
                                <Input
                                    type="date"
                                    value={selected.next_follow_up_at ?? ''}
                                    disabled={!selected.can_update}
                                    onChange={(event) =>
                                        setSelected({
                                            ...selected,
                                            next_follow_up_at:
                                                event.target.value,
                                        })
                                    }
                                />
                                <div className="md:col-span-3">
                                    <Button
                                        type="submit"
                                        disabled={!selected.can_update}
                                    >
                                        Update inquiry
                                    </Button>
                                    {!selected.can_update && (
                                        <span className="ml-3 text-sm text-muted-foreground">
                                            Only{' '}
                                            {selected.assigned_user?.name ??
                                                'the assigned user'}{' '}
                                            can change these fields.
                                        </span>
                                    )}
                                </div>
                            </form>

                            <div className="grid gap-3 rounded-md border p-3 text-sm md:grid-cols-2">
                                <Info
                                    label="Program"
                                    value={
                                        selected.program?.name ?? 'No program'
                                    }
                                />
                                <Info
                                    label="Previous program"
                                    value={
                                        selected.previous_program ?? 'Not set'
                                    }
                                />
                                <Info
                                    label="Campus"
                                    value={
                                        selected.campus_model?.name ??
                                        selected.campus ??
                                        'Not set'
                                    }
                                />
                                <Info
                                    label="Source"
                                    value={selected.source ?? 'Not set'}
                                />
                                <Info
                                    label="Assigned user"
                                    value={
                                        selected.assigned_user?.name ??
                                        'Unassigned'
                                    }
                                />
                                <Info
                                    label="Address"
                                    value={selected.address ?? 'No address'}
                                />
                                <Info
                                    label="Initial message"
                                    value={
                                        selected.message ?? 'No initial message'
                                    }
                                />
                            </div>

                            <form className="space-y-2" onSubmit={submitStream}>
                                <Label htmlFor="stream">
                                    Discussion stream
                                </Label>
                                <textarea
                                    id="stream"
                                    className="min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                    value={streamText}
                                    onChange={(event) =>
                                        setStreamText(event.target.value)
                                    }
                                />
                                <Button type="submit">
                                    <Send />
                                    Submit stream
                                </Button>
                            </form>

                            <div className="space-y-3 border-t pt-4">
                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant={
                                            activeHistory === 'all'
                                                ? 'default'
                                                : 'outline'
                                        }
                                        onClick={() => setActiveHistory('all')}
                                    >
                                        All
                                    </Button>
                                    {selectedUserTabs.map(([id, name]) => (
                                        <Button
                                            key={id}
                                            type="button"
                                            size="sm"
                                            variant={
                                                activeHistory === id
                                                    ? 'default'
                                                    : 'outline'
                                            }
                                            onClick={() => setActiveHistory(id)}
                                        >
                                            {name}
                                        </Button>
                                    ))}
                                </div>
                                <div className="space-y-2">
                                    {visibleStreams.map((stream) => (
                                        <div
                                            key={stream.id}
                                            className="rounded-md border p-3"
                                        >
                                            <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                                                <MessageSquarePlus className="size-4" />
                                                <span>
                                                    {stream.user?.name ??
                                                        'Unknown user'}
                                                </span>
                                                <span>{stream.created_at}</span>
                                            </div>
                                            <p className="text-sm">
                                                {stream.response}
                                            </p>
                                        </div>
                                    ))}
                                    {visibleStreams.length === 0 && (
                                        <div className="rounded-md border p-4 text-sm text-muted-foreground">
                                            No stream history yet.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}

function InquiryFormFields({
    form,
    programs,
    campuses,
    teamMembers,
    statusOptions,
    departmentOptions,
    onChange,
    onSubmit,
}: {
    form: InquiryForm;
    programs: Option[];
    campuses: Option[];
    teamMembers: Option[];
    statusOptions: string[];
    departmentOptions: string[];
    onChange: (form: InquiryForm) => void;
    onSubmit: (event: FormEvent) => void;
}) {
    return (
        <form className="grid gap-4" onSubmit={onSubmit}>
            <div className="grid gap-3 md:grid-cols-2">
                <Field
                    label="Name"
                    value={form.name}
                    onChange={(name) => onChange({ ...form, name })}
                    required
                />
                <Field
                    label="Phone"
                    value={form.phone}
                    onChange={(phone) => onChange({ ...form, phone })}
                    required
                />
                <Field
                    label="Email"
                    type="email"
                    value={form.email}
                    onChange={(email) => onChange({ ...form, email })}
                />
                <Field
                    label="City"
                    value={form.city}
                    onChange={(city) => onChange({ ...form, city })}
                />
                <Field
                    label="Source"
                    value={form.source}
                    onChange={(source) => onChange({ ...form, source })}
                />
                <SelectField
                    label="Program"
                    value={form.program_id}
                    placeholder="No program"
                    options={programs.map((program) => ({
                        value: String(program.id),
                        label: program.name,
                    }))}
                    onChange={(program_id) => onChange({ ...form, program_id })}
                />
                <Field
                    label="Previous program"
                    value={form.previous_program}
                    onChange={(previous_program) =>
                        onChange({ ...form, previous_program })
                    }
                />
                <SelectField
                    label="Campus"
                    value={form.campus_id}
                    placeholder="No campus"
                    options={campuses.map((campus) => ({
                        value: String(campus.id),
                        label: campus.name,
                    }))}
                    onChange={(campus_id) => onChange({ ...form, campus_id })}
                />
                <SelectField
                    label="Assigned user"
                    value={form.assigned_user_id}
                    placeholder="Unassigned"
                    options={teamMembers.map((member) => ({
                        value: String(member.id),
                        label: member.name,
                    }))}
                    onChange={(assigned_user_id) =>
                        onChange({ ...form, assigned_user_id })
                    }
                />
                <FilterSelect
                    label="Status"
                    placeholder="Status"
                    value={form.status}
                    options={statusOptions}
                    onChange={(status) => onChange({ ...form, status })}
                />
                <FilterSelect
                    label="Department"
                    placeholder="Department"
                    value={form.department}
                    options={departmentOptions}
                    onChange={(department) => onChange({ ...form, department })}
                />
                <Field
                    label="Next follow up"
                    type="date"
                    value={form.next_follow_up_at}
                    onChange={(next_follow_up_at) =>
                        onChange({ ...form, next_follow_up_at })
                    }
                />
            </div>
            <div className="grid gap-2">
                <Label>Address</Label>
                <textarea
                    className="min-h-20 rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    value={form.address}
                    onChange={(event) =>
                        onChange({ ...form, address: event.target.value })
                    }
                />
            </div>
            <div className="grid gap-2">
                <Label>Initial message</Label>
                <textarea
                    className="min-h-20 rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    value={form.message}
                    onChange={(event) =>
                        onChange({ ...form, message: event.target.value })
                    }
                />
            </div>
            <DialogFooter>
                <Button type="submit">Save inquiry</Button>
            </DialogFooter>
        </form>
    );
}

function Metric({ label, value }: { label: string; value: number }) {
    return (
        <div className="rounded-lg border bg-background p-4">
            <div className="text-sm text-muted-foreground">{label}</div>
            <div className="mt-1 text-2xl font-semibold">{value}</div>
        </div>
    );
}

function Field({
    label,
    value,
    onChange,
    type = 'text',
    required = false,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    type?: string;
    required?: boolean;
}) {
    return (
        <div className="grid gap-2">
            <Label>{label}</Label>
            <Input
                type={type}
                value={value}
                required={required}
                onChange={(event) => onChange(event.target.value)}
            />
        </div>
    );
}

function PaginationControls({
    pagination,
}: {
    pagination: {
        current_page: number;
        from: number | null;
        last_page: number;
        next_page_url: string | null;
        prev_page_url: string | null;
        to: number | null;
        total: number;
    };
}) {
    const visitPage = (url: string | null) => {
        if (!url) return;

        router.visit(url, {
            preserveScroll: true,
            preserveState: true,
        });
    };

    return (
        <div className="flex flex-col gap-3 border-t p-4 md:flex-row md:items-center md:justify-between">
            <div className="text-sm text-muted-foreground">
                {pagination.total > 0
                    ? `Showing ${pagination.from} to ${pagination.to} of ${pagination.total} inquiries`
                    : 'No inquiries to show'}
            </div>
            <div className="flex items-center gap-2">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!pagination.prev_page_url}
                    onClick={() => visitPage(pagination.prev_page_url)}
                >
                    Previous
                </Button>
                <span className="px-2 text-sm text-muted-foreground">
                    Page {pagination.current_page} of {pagination.last_page}
                </span>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!pagination.next_page_url}
                    onClick={() => visitPage(pagination.next_page_url)}
                >
                    Next
                </Button>
            </div>
        </div>
    );
}

function reportQuery(filters: ReportFilters): string {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
        if (value) params.set(key, value);
    });

    return params.toString();
}

function ReportField({
    label,
    children,
}: {
    label: string;
    children: ReactNode;
}) {
    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            {children}
        </div>
    );
}

function formatLocalDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

function FilterSelect({
    label,
    placeholder,
    value,
    options,
    disabled = false,
    onChange,
}: {
    label?: string;
    placeholder: string;
    value: string;
    options: string[];
    disabled?: boolean;
    onChange: (value: string) => void;
}) {
    return (
        <div className={label ? 'grid gap-2' : ''}>
            {label && <Label>{label}</Label>}
            <Select
                value={value || 'all'}
                disabled={disabled}
                onValueChange={(next) => onChange(next === 'all' ? '' : next)}
            >
                <SelectTrigger className="w-full">
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                    {!label && (
                        <SelectItem value="all">
                            All {placeholder.toLowerCase()}
                        </SelectItem>
                    )}
                    {options.map((option) => (
                        <SelectItem key={option} value={option}>
                            {option}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}

function SelectField({
    label,
    value,
    placeholder,
    options,
    onChange,
}: {
    label: string;
    value: string;
    placeholder: string;
    options: { value: string; label: string }[];
    onChange: (value: string) => void;
}) {
    return (
        <div className="grid gap-2">
            <Label>{label}</Label>
            <Select
                value={value || 'none'}
                onValueChange={(next) => onChange(next === 'none' ? '' : next)}
            >
                <SelectTrigger className="w-full">
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="none">{placeholder}</SelectItem>
                    {options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}

function Info({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <div className="text-xs text-muted-foreground">{label}</div>
            <div>{value}</div>
        </div>
    );
}

function LastDiscussion({
    text,
    expanded,
    onToggle,
}: {
    text: string;
    expanded: boolean;
    onToggle: () => void;
}) {
    const limit = 40;
    const canExpand = text.length > limit;
    const preview =
        canExpand && !expanded ? `${text.slice(0, limit).trim()}...` : text;

    return (
        <div className="space-y-1">
            <p className={expanded ? 'whitespace-pre-wrap' : 'line-clamp-2'}>
                {preview}
            </p>
            {canExpand && (
                <Button
                    type="button"
                    variant="link"
                    className="h-auto p-0 text-xs"
                    onClick={onToggle}
                >
                    {expanded ? 'Show less' : 'Read more'}
                </Button>
            )}
        </div>
    );
}

function Th({ children }: { children?: ReactNode }) {
    return <th className="px-4 py-3 text-left font-medium">{children}</th>;
}

function Td({
    children,
    className = '',
}: {
    children: ReactNode;
    className?: string;
}) {
    return <td className={`px-4 py-3 align-top ${className}`}>{children}</td>;
}

function cleanPayload(payload: Record<string, string>) {
    return Object.fromEntries(
        Object.entries(payload).filter(([, value]) => value !== ''),
    );
}

function normalizeInquiry(row: InquiryForm) {
    return {
        ...row,
        email: row.email || null,
        city: row.city || null,
        address: row.address || null,
        source: row.source || null,
        program_id: row.program_id || null,
        previous_program: row.previous_program || null,
        campus_id: row.campus_id || null,
        campus: row.campus || null,
        assigned_user_id: row.assigned_user_id || null,
        next_follow_up_at: row.next_follow_up_at || null,
        message: row.message || null,
    };
}

function parseCsv(text: string): Record<string, string>[] {
    const rows: string[][] = [];
    let cell = '';
    let row: string[] = [];
    let quoted = false;

    for (let index = 0; index < text.length; index += 1) {
        const char = text[index];
        const next = text[index + 1];

        if (char === '"' && quoted && next === '"') {
            cell += '"';
            index += 1;
        } else if (char === '"') {
            quoted = !quoted;
        } else if (char === ',' && !quoted) {
            row.push(cell.trim());
            cell = '';
        } else if ((char === '\n' || char === '\r') && !quoted) {
            if (char === '\r' && next === '\n') index += 1;
            row.push(cell.trim());
            rows.push(row);
            row = [];
            cell = '';
        } else {
            cell += char;
        }
    }

    row.push(cell.trim());
    rows.push(row);

    const headers =
        rows
            .shift()
            ?.map((header) =>
                header.toLowerCase().trim().replace(/\s+/g, '_'),
            ) ?? [];

    return rows
        .filter((items) => items.some(Boolean))
        .map((items) =>
            Object.fromEntries(
                headers.map((header, index) => [header, items[index] ?? '']),
            ),
        );
}

function csvRowToInquiry(
    row: Record<string, string>,
    programs: Option[],
    campuses: Option[],
    teamMembers: Option[],
): InquiryForm {
    const programName = row.program ?? row.program_name ?? '';
    const campusName =
        row.campus ?? row.campus_name ?? row.branch ?? row.location ?? '';
    const assignedName = row.assigned_user ?? row.assigned ?? '';

    return {
        ...emptyInquiry,
        name: row.name ?? '',
        phone: row.phone ?? '',
        email: row.email ?? '',
        city: row.city ?? '',
        address: row.address ?? '',
        source: row.source ?? row.lead_source ?? row.inquiry_source ?? '',
        program_id:
            row.program_id ??
            String(
                programs.find(
                    (program) =>
                        program.name.toLowerCase() ===
                        programName.toLowerCase(),
                )?.id ?? '',
            ),
        previous_program:
            row.previous_program ??
            row.previous_program_name ??
            row.old_program ??
            '',
        campus_id:
            row.campus_id ??
            String(
                campuses.find(
                    (campus) =>
                        campus.name.toLowerCase() === campusName.toLowerCase(),
                )?.id ?? '',
            ),
        campus: campusName,
        status: row.status || 'pending',
        assigned_user_id:
            row.assigned_user_id ??
            String(
                teamMembers.find(
                    (member) =>
                        member.name.toLowerCase() ===
                        assignedName.toLowerCase(),
                )?.id ?? '',
            ),
        department: row.department || 'admission',
        next_follow_up_at: row.next_follow_up_at ?? row.follow_up ?? '',
        message: row.message ?? row.discussion ?? '',
    };
}

Dashboard.layout = (props: { pageTitle?: string; pageUrl?: string }) => ({
    breadcrumbs: [
        {
            title: props.pageTitle ?? 'Dashboard',
            href: props.pageUrl ?? '/dashboard',
        },
    ],
});
