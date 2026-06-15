import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    CalendarClock,
    ChevronLeft,
    ChevronRight,
    Eye,
    FileDown,
    FileText,
    FileSpreadsheet,
    Filter,
    LoaderCircle,
    Mail,
    MessageSquarePlus,
    PenLine,
    Phone,
    Plus,
    Search,
    Send,
    Upload,
    UserCheck,
    X,
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

// Types and utils
type Option = { id: number; name: string };
type TeamMember = Option & { department: string };
type CampusOption = Option & { is_active: boolean };
type Stream = {
    id: number;
    response: string;
    user: Option | null;
    created_at: string;
    last_status: string | null;
};
// The inquiry type represents the structure of an inquiry as received from the server. It includes all the fields that are relevant for displaying and managing inquiries in the dashboard.
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
    postal_communication: 'pending' | 'send';
    next_follow_up_at: string | null;
    assigned_at: string | null;
    last_activity_at: string | null;
    message: string | null;
    can_update: boolean;
    can_stream: boolean;
    created_at: string;
    streams: Stream[];
};
// The inquiry form type represents the structure of the data used when creating or updating an inquiry. It includes all the fields that are necessary for submitting an inquiry to the server, and may have a slightly different structure than the Inquiry type, such as using string IDs for related entities instead of nested objects.
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

// The report filters type represents the structure of the filters that can be applied when generating an inquiry report. It includes fields for filtering by campus, status, assigned user, and date range.
type ReportFilters = {
    campus_id: string;
    status: string;
    assigned_user_id: string;
    date_from: string;
    date_to: string;
};

// The report inquiry type represents the structure of an inquiry as it appears in the generated report. It includes fields that are relevant for reporting purposes, which may be a subset of the full Inquiry type or may have a different structure to optimize for reporting.
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

// The inquiry report type represents the structure of the data returned when generating an inquiry report. It includes metadata about the report generation, the applied filters, counts of inquiries by status, and a list of inquiries that match the report criteria.
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

// The filter counts type represents the structure of the counts of inquiries for each filter category. It includes records for status, department, source, campus, and assigned user, where each record maps a specific filter value to the count of inquiries that match that value.
type FilterCounts = {
    status: Record<string, number>;
    department: Record<string, number>;
    source: Record<string, number>;
    campus: Record<string, number>;
    assigned_user: Record<string, number>;
};

// The queue counts type represents the structure of the counts of inquiries in different follow-up queues. It includes the total number of inquiries, the number of inquiries assigned today, and the number of follow-ups scheduled for yesterday, today, and the next 3 days.
type QueueCounts = {
    total_inquiries: number;
    assigned_today: number;
    follow_ups_yesterday: number;
    follow_ups_today: number;
    follow_ups_next_3_days: number;
};

// The empty inquiry constant represents the initial state of an inquiry form when creating a new inquiry. It includes default values for all the fields in the InquiryForm type, which can be used to reset the form after submission or when opening the create inquiry dialog.
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

// The empty report filters constant represents the initial state of the report filters when generating a new inquiry report. It includes default values for all the fields in the ReportFilters type, which can be used to reset the filters after generating a report or when opening the report filter dialog.
const emptyReportFilters: ReportFilters = {
    campus_id: '',
    status: '',
    assigned_user_id: '',
    date_from: '',
    date_to: '',
};

// Utility function to clean the filter payload by removing empty values. This function takes an object representing the filter form and returns a new object that only includes key-value pairs where the value is not an empty string. This is useful for constructing query parameters when submitting filters, ensuring that only active filters are included in the request.
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
    postalCommunicationOptions,
    inquiryCreationDefaults,
    filterCounts,
    queueCounts,
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

    // The programs, campuses, teamMembers, sourceOptions, statusOptions, and departmentOptions props represent the available options for filtering and managing inquiries in the dashboard. They are used to populate dropdowns and selection components in the UI, allowing users to filter inquiries by program, campus, assigned user, source, status, and department. The filterCounts prop provides the counts of inquiries for each filter category, which can be displayed alongside the filter options to give users insight into how many inquiries match each filter value. The queueCounts prop provides counts of inquiries in different follow-up queues, which can be displayed in the dashboard header to give users an overview of their workload and upcoming follow-ups. The crmPermissions prop indicates the user's permissions for managing inquiries, which can be used to conditionally render UI elements and actions based on what the user is allowed to do.
    programs: Option[];
    campuses: CampusOption[];
    teamMembers: TeamMember[];
    sourceOptions: string[];
    statusOptions: string[];
    departmentOptions: string[];
    postalCommunicationOptions: string[];
    inquiryCreationDefaults: {
        assigned_user_id: string;
        department: string;
    };
    filterCounts: FilterCounts;
    queueCounts: QueueCounts;
    crmPermissions: {
        canCreateInquiry: boolean;
        canImportInquiry: boolean;
        canAssignInquiry: boolean;
        canSelectInquiryAssignee: boolean;
        canChangeInquiryDepartment: boolean;
        canManageCampus: boolean;
    };
}) {
    // State variables for managing the dashboard's interactive features, such as filtering, creating inquiries, importing inquiries, viewing inquiry details, managing selected inquiries for bulk actions, handling report generation, and managing search suggestions. These state variables are used to control the visibility of dialogs, store form data, track loading states, and manage user interactions throughout the dashboard.
    const csvInputRef = useRef<HTMLInputElement>(null);
    const [filterForm, setFilterForm] = useState(filters);
    const [createOpen, setCreateOpen] = useState(false);
    const [importOpen, setImportOpen] = useState(false);
    const [detailOpen, setDetailOpen] = useState(false);
    const [selected, setSelected] = useState<Inquiry | null>(null);
    const [editingInquiryDetails, setEditingInquiryDetails] = useState(false);
    const [inquiryBeforeEdit, setInquiryBeforeEdit] = useState<Inquiry | null>(
        null,
    );
    const createInquiryDefaults = {
        ...emptyInquiry,
        ...inquiryCreationDefaults,
    };
    const [newInquiry, setNewInquiry] = useState<InquiryForm>(
        createInquiryDefaults,
    );
    const [importRows, setImportRows] = useState<InquiryForm[]>([]);
    const [streamText, setStreamText] = useState('');
    const [activeHistory, setActiveHistory] = useState('all');
    const [selectedInquiryIds, setSelectedInquiryIds] = useState<number[]>([]);
    const [bulkAssignedUserId, setBulkAssignedUserId] = useState('');
    const [expandedDiscussionIds, setExpandedDiscussionIds] = useState<
        number[]
    >([]);
    const [reportFilterOpen, setReportFilterOpen] = useState(false);
    const [reportPreviewOpen, setReportPreviewOpen] = useState(false);
    const [reportFilters, setReportFilters] =
        useState<ReportFilters>(emptyReportFilters);
    const [report, setReport] = useState<InquiryReport | null>(null);
    const [reportLoading, setReportLoading] = useState(false);
    const [reportError, setReportError] = useState('');
    const [updatingInquiry, setUpdatingInquiry] = useState(false);
    const [inquiryUpdateError, setInquiryUpdateError] = useState('');
    const [searchSuggestions, setSearchSuggestions] = useState<Inquiry[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);

    const activeCampuses = useMemo(
        () => campuses.filter((campus) => campus.is_active),
        [campuses],
    );

    // The selectedUserTabs variable is a memoized value that computes the list of users who have interacted with the currently selected inquiry through its streams. It iterates over the streams of the selected inquiry, counts the number of interactions for each user, and returns an array of user objects with their ID, name, and interaction count. This is used to display tabs or sections in the inquiry detail view for each user who has participated in the discussion, allowing users to easily navigate through the conversation history with different team members.
    const selectedUserTabs = useMemo(() => {
        const users = new Map<
            string,
            { id: string; name: string; count: number }
        >();
        selected?.streams.forEach((stream) => {
            if (!stream.user) return;

            const id = String(stream.user.id);
            const existing = users.get(id);
            users.set(id, {
                id,
                name: stream.user.name,
                count: (existing?.count ?? 0) + 1,
            });
        });

        return [...users.values()];
    }, [selected]);

    // The visibleStreams variable computes the list of streams that should be displayed in the inquiry detail view based on the active history filter. If the active history is set to 'all', it returns all streams associated with the selected inquiry. Otherwise, it filters the streams to include only those that were created by the user corresponding to the active history ID. This allows users to focus on the interactions of a specific team member when reviewing the inquiry's discussion history.
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
        setSelected((current) => {
            if (!current) return current;

            return (
                inquiries.find((inquiry) => inquiry.id === current.id) ??
                current
            );
        });
    }, [inquiries]);

    useEffect(() => {
        setFilterForm(filters);
    }, [filters]);

    useEffect(() => {
        const visibleIds = new Set(inquiries.map((inquiry) => inquiry.id));
        setSelectedInquiryIds((current) =>
            current.filter((id) => visibleIds.has(id)),
        );
    }, [inquiries]);

    useEffect(() => {
        const query = (filterForm.search ?? '').trim();

        if (query.length < 2) {
            setSearchSuggestions([]);
            setSearchLoading(false);
            return;
        }

        const controller = new AbortController();
        const timer = window.setTimeout(async () => {
            setSearchLoading(true);

            try {
                const params = new URLSearchParams({
                    query,
                    mode: pageMode,
                });
                const response = await fetch(`/inquiries/search?${params}`, {
                    headers: { Accept: 'application/json' },
                    signal: controller.signal,
                });

                if (!response.ok) throw new Error('Search failed.');

                const payload = (await response.json()) as {
                    results: Inquiry[];
                };
                setSearchSuggestions(payload.results);
                setShowSearchSuggestions(true);
            } catch (error) {
                if (
                    error instanceof DOMException &&
                    error.name === 'AbortError'
                )
                    return;

                setSearchSuggestions([]);
            } finally {
                if (!controller.signal.aborted) setSearchLoading(false);
            }
        }, 300);

        return () => {
            window.clearTimeout(timer);
            controller.abort();
        };
    }, [filterForm.search, pageMode]);

    const submitFilters = (event: FormEvent) => {
        event.preventDefault();
        router.get(pageUrl, cleanPayload(filterForm), {
            preserveState: true,
            replace: true,
        });
    };

    const clearFilters = () => {
        const resetFilters: Record<string, string> = {
            queue: filterForm.queue ?? 'all',
        };
        setFilterForm(resetFilters);
        router.get(pageUrl, resetFilters, {
            preserveState: false,
            replace: true,
        });
    };

    const changeFollowUpQueue = (
        queue: 'all' | 'assigned_today' | 'yesterday' | 'today' | 'next_3_days',
    ) => {
        const nextFilters = { ...filterForm, queue };
        setFilterForm(nextFilters);
        router.get(pageUrl, cleanPayload(nextFilters), {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const submitInquiry = (event: FormEvent) => {
        event.preventDefault();
        router.post('/inquiries', normalizeInquiry(newInquiry), {
            onSuccess: () => {
                setCreateOpen(false);
                setNewInquiry(createInquiryDefaults);
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

    // The assignSelectedInquiries function is responsible for assigning the selected inquiries to a user in bulk. It checks if there is a user selected for assignment and if there are any inquiries selected. If both conditions are met, it sends a PATCH request to the server with the IDs of the selected inquiries and the ID of the user to assign them to. Upon successful assignment, it clears the selection and resets the bulk assigned user state.
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

    // The toggleSelectedInquiry function is used to manage the selection of inquiries for bulk actions. It takes an inquiry ID and a boolean indicating whether the inquiry is being selected or deselected. If the inquiry is being selected, it adds the inquiry ID to the list of selected inquiry IDs, ensuring that there are no duplicates. If the inquiry is being deselected, it removes the inquiry ID from the list of selected inquiry IDs. This function allows users to easily select multiple inquiries for bulk operations such as assignment.
    const toggleSelectedInquiry = (inquiryId: number, checked: boolean) => {
        setSelectedInquiryIds((current) =>
            checked
                ? [...new Set([...current, inquiryId])]
                : current.filter((id) => id !== inquiryId),
        );
    };

    // The toggleAllVisibleInquiries function is used to select or deselect all inquiries that are currently visible in the dashboard. It takes a boolean indicating whether all inquiries should be selected or deselected. If the boolean is true, it sets the selected inquiry IDs to include the IDs of all visible inquiries. If the boolean is false, it clears the selection by setting the selected inquiry IDs to an empty array. This function provides a convenient way for users to quickly select or deselect all inquiries in the current view for bulk actions.
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

    // The saveInquiryActivity function is responsible for saving a new activity or note to the selected inquiry. It first checks if there is a selected inquiry and if the stream text is not empty. If the stream text is empty, it sets an error message prompting the user to write a discussion note before submitting. If there is valid input, it sends a PATCH request to the server with the updated activity information. The payload of the request depends on whether the user has permission to update the inquiry; if they do, it includes all relevant fields, otherwise it only includes the response text. Upon successful update, it clears the stream text and handles any errors by setting an appropriate error message.
    const saveInquiryActivity = (event: FormEvent) => {
        event.preventDefault();
        if (!selected) return;

        if (!streamText.trim()) {
            setInquiryUpdateError('Write a discussion note before submitting.');
            return;
        }

        setUpdatingInquiry(true);
        setInquiryUpdateError('');
        router.patch(
            `/inquiries/${selected.id}/activity`,
            selected.can_update
                ? {
                      name: selected.name,
                      phone: selected.phone,
                      email: selected.email ?? '',
                      city: selected.city ?? '',
                      address: selected.address ?? '',
                      source: selected.source ?? '',
                      program_id: selected.program_id ?? '',
                      previous_program: selected.previous_program ?? '',
                      campus_id: selected.campus_id ?? '',
                      message: selected.message ?? '',
                      status: selected.status,
                      department: selected.department,
                      postal_communication: selected.postal_communication,
                      next_follow_up_at: selected.next_follow_up_at ?? '',
                      response: streamText,
                  }
                : { response: streamText },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setStreamText('');
                    setEditingInquiryDetails(false);
                    setInquiryBeforeEdit(null);
                },
                onError: (errors) => {
                    setInquiryUpdateError(
                        Object.values(errors)[0] ??
                            'The inquiry could not be updated.',
                    );
                },
                onFinish: () => setUpdatingInquiry(false),
            },
        );
    };

    const openDetail = (inquiry: Inquiry) => {
        setSelected(inquiry);
        setEditingInquiryDetails(false);
        setInquiryBeforeEdit(null);
        setInquiryUpdateError('');
        setActiveHistory('all');
        setDetailOpen(true);
    };

    const handleCsv = async (file?: File) => {
        if (!file) return;

        const rows = parseCsv(await file.text())
            .map((row) => csvRowToInquiry(row, programs, activeCampuses))
            .filter((row) => row.name || row.phone || row.email);

        setImportRows(rows);
        setImportOpen(true);
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

    // The dashboard component returns the JSX structure of the dashboard page, including the header with the page title and description, the metric cards displaying counts of inquiries in different queues, the filter and action panel for managing inquiries, and the list of inquiries with options for searching, filtering, and performing bulk actions. It also includes dialogs for creating new inquiries, importing inquiries from CSV, viewing inquiry details, and generating reports. The component uses various state variables and functions to manage user interactions and data flow throughout the dashboard.
    return (
        <>
            <Head title={pageTitle} />
            <div className="crm-page overflow-x-auto">
                <div className="crm-page-header">
                    <div className="flex flex-col gap-1">
                        <h1 className="crm-page-title">{pageTitle}</h1>
                        <p className="crm-page-description">
                            Review, filter, assign, and follow up on inquiries.
                        </p>
                    </div>
                </div>

                <div className="grid gap-3 md:grid-cols-4">
                    <Metric
                        label={
                            pageMode === 'assigned'
                                ? 'My inquiries'
                                : 'All inquiries'
                        }
                        value={queueCounts.total_inquiries}
                    />
                    <Metric
                        label="Assigned today"
                        value={queueCounts.assigned_today}
                    />
                    <Metric
                        label="Follow-ups today"
                        value={queueCounts.follow_ups_today}
                    />
                    <Metric
                        label="Next 3 days"
                        value={queueCounts.follow_ups_next_3_days}
                    />
                </div>

                <div className="crm-panel p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-sm font-semibold">
                                {filterForm.queue === 'assigned_today'
                                    ? 'Assigned today'
                                    : pageMode === 'assigned'
                                      ? 'My assigned inquiries'
                                      : 'All inquiries'}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                {filterForm.queue === 'assigned_today'
                                    ? pageMode === 'assigned'
                                        ? 'Inquiries assigned to you today.'
                                        : 'All inquiries assigned today across active campuses.'
                                    : pageMode === 'assigned'
                                      ? 'Review every inquiry assigned to you and focus by follow-up date.'
                                      : 'Complete inquiry register across active campuses.'}
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="inline-flex flex-wrap rounded-md border bg-muted/35 p-1">
                                <Button
                                    type="button"
                                    size="sm"
                                    variant={
                                        (filterForm.queue ?? 'all') === 'all'
                                            ? 'secondary'
                                            : 'ghost'
                                    }
                                    className="shadow-none"
                                    onClick={() => changeFollowUpQueue('all')}
                                >
                                    {pageMode === 'assigned'
                                        ? 'All assigned'
                                        : 'All inquiries'}
                                    <Badge variant="outline">
                                        {queueCounts.total_inquiries}
                                    </Badge>
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant={
                                        filterForm.queue === 'assigned_today'
                                            ? 'secondary'
                                            : 'ghost'
                                    }
                                    className="shadow-none"
                                    onClick={() =>
                                        changeFollowUpQueue('assigned_today')
                                    }
                                >
                                    Assigned today
                                    <Badge variant="outline">
                                        {queueCounts.assigned_today}
                                    </Badge>
                                </Button>
                                {pageMode === 'assigned' && (
                                    <>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant={
                                                filterForm.queue === 'yesterday'
                                                    ? 'secondary'
                                                    : 'ghost'
                                            }
                                            className="shadow-none"
                                            onClick={() =>
                                                changeFollowUpQueue('yesterday')
                                            }
                                        >
                                            Yesterday
                                            <Badge variant="outline">
                                                {
                                                    queueCounts.follow_ups_yesterday
                                                }
                                            </Badge>
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant={
                                                filterForm.queue === 'today'
                                                    ? 'secondary'
                                                    : 'ghost'
                                            }
                                            className="shadow-none"
                                            onClick={() =>
                                                changeFollowUpQueue('today')
                                            }
                                        >
                                            Today
                                            <Badge variant="outline">
                                                {queueCounts.follow_ups_today}
                                            </Badge>
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant={
                                                filterForm.queue ===
                                                'next_3_days'
                                                    ? 'secondary'
                                                    : 'ghost'
                                            }
                                            className="shadow-none"
                                            onClick={() =>
                                                changeFollowUpQueue(
                                                    'next_3_days',
                                                )
                                            }
                                        >
                                            Next 3 days
                                            <Badge variant="outline">
                                                {
                                                    queueCounts.follow_ups_next_3_days
                                                }
                                            </Badge>
                                        </Button>
                                    </>
                                )}
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
                </div>

                <div className="crm-panel">
                    <div className="space-y-3 border-b p-4">
                        <form className="space-y-3" onSubmit={submitFilters}>
                            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                                <div className="relative w-full lg:max-w-2xl">
                                    <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        className="h-11 pr-10 pl-9 text-base md:text-sm"
                                        placeholder="Search by name, phone, or email"
                                        value={filterForm.search ?? ''}
                                        onFocus={() =>
                                            setShowSearchSuggestions(true)
                                        }
                                        onKeyDown={(event) => {
                                            if (event.key === 'Escape')
                                                setShowSearchSuggestions(false);
                                        }}
                                        onChange={(event) => {
                                            setFilterForm({
                                                ...filterForm,
                                                search: event.target.value,
                                            });
                                            setShowSearchSuggestions(true);
                                        }}
                                    />
                                    {searchLoading && (
                                        <LoaderCircle className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                                    )}

                                    {showSearchSuggestions &&
                                        (filterForm.search ?? '').trim()
                                            .length >= 2 && (
                                            <SearchSuggestionPanel
                                                loading={searchLoading}
                                                results={searchSuggestions}
                                                onSelect={(inquiry) => {
                                                    setShowSearchSuggestions(
                                                        false,
                                                    );
                                                    openDetail(inquiry);
                                                }}
                                            />
                                        )}
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
                                        onClick={() => {
                                            setNewInquiry(
                                                createInquiryDefaults,
                                            );
                                            setCreateOpen(true);
                                        }}
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
                                    counts={filterCounts.status}
                                    onChange={(status) =>
                                        setFilterForm({ ...filterForm, status })
                                    }
                                />
                                <FilterSelect
                                    placeholder="Department"
                                    value={filterForm.department ?? ''}
                                    options={departmentOptions}
                                    counts={filterCounts.department}
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
                                                    {member.name} (
                                                    {filterCounts.assigned_user[
                                                        String(member.id)
                                                    ] ?? 0}
                                                    )
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                                <FilterSelect
                                    placeholder="Source"
                                    value={filterForm.source ?? ''}
                                    options={sourceOptions}
                                    counts={filterCounts.source}
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
                                                {campus.name} (
                                                {filterCounts.campus[
                                                    String(campus.id)
                                                ] ?? 0}
                                                )
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
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={clearFilters}
                                >
                                    Clear
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

                    <div className="relative overflow-x-auto">
                        <table className="w-full min-w-[1180px] text-sm">
                            <thead className="sticky top-0 z-10 bg-muted text-muted-foreground shadow-[inset_0_-1px_0_var(--border)]">
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
                                    <tr
                                        key={inquiry.id}
                                        className={[
                                            'group border-t transition-colors hover:bg-muted/35',
                                            selectedInquiryIds.includes(
                                                inquiry.id,
                                            )
                                                ? 'bg-primary/5'
                                                : '',
                                        ].join(' ')}
                                    >
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
                                        <Td className="whitespace-nowrap">
                                            <div className="flex items-center gap-1.5">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8"
                                                    onClick={() =>
                                                        openDetail(inquiry)
                                                    }
                                                >
                                                    <Eye />
                                                    View
                                                </Button>
                                                {inquiry.postal_communication ===
                                                    'send' && (
                                                    <Button
                                                        asChild
                                                        type="button"
                                                        variant="outline"
                                                        size="icon"
                                                        className="size-8 text-primary"
                                                        title="Download invitation letter PDF"
                                                    >
                                                        <a
                                                            href={`/inquiries/${inquiry.id}/invitation-letter.pdf`}
                                                            aria-label={`Download invitation letter for ${inquiry.name}`}
                                                        >
                                                            <FileDown />
                                                        </a>
                                                    </Button>
                                                )}
                                            </div>
                                        </Td>
                                        <Td className="min-w-52">
                                            <div className="font-semibold text-foreground">
                                                {inquiry.name}
                                            </div>
                                            <div className="mt-1 text-xs text-muted-foreground">
                                                {inquiry.phone}
                                            </div>
                                            {inquiry.email && (
                                                <div className="max-w-52 truncate text-xs text-muted-foreground">
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
                                            <StatusBadge
                                                status={inquiry.status}
                                            />
                                        </Td>
                                        <Td>
                                            <span className="capitalize">
                                                {inquiry.department}
                                            </span>
                                        </Td>
                                        <Td className="whitespace-nowrap">
                                            <span className="inline-flex items-center gap-1.5">
                                                <CalendarClock className="size-4 text-muted-foreground" />
                                                {inquiry.next_follow_up_at ??
                                                    'Not set'}
                                            </span>
                                        </Td>
                                        <Td className="max-w-80 min-w-64">
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
                                            className="p-12 text-center text-muted-foreground"
                                            colSpan={
                                                crmPermissions.canAssignInquiry
                                                    ? 12
                                                    : 11
                                            }
                                        >
                                            <div className="font-medium text-foreground">
                                                No inquiries found
                                            </div>
                                            <div className="mt-1 text-sm">
                                                Adjust the filters or add a new
                                                inquiry.
                                            </div>
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
                        canSelectAssignee={
                            crmPermissions.canSelectInquiryAssignee
                        }
                        canChangeDepartment={
                            crmPermissions.canChangeInquiryDepartment
                        }
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
                            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
                                <ReportSummary
                                    label="Total"
                                    value={report.total}
                                    primary
                                />
                                {Object.entries(report.statusCounts)
                                    .filter(([, count]) => count > 0)
                                    .map(([status, count]) => (
                                        <ReportSummary
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
                            <div className="relative max-h-[55vh] overflow-auto rounded-md border">
                                <table className="w-full min-w-[1050px] text-sm">
                                    <thead className="sticky top-0 z-10 bg-muted text-muted-foreground shadow-[inset_0_-1px_0_var(--border)]">
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
                                                className="border-t transition-colors hover:bg-muted/35"
                                            >
                                                <Td className="font-mono text-xs text-muted-foreground">
                                                    #{inquiry.id}
                                                </Td>
                                                <Td className="min-w-52">
                                                    <div className="font-semibold text-foreground">
                                                        {inquiry.name}
                                                    </div>
                                                    <div className="mt-1 text-xs text-muted-foreground">
                                                        {inquiry.phone}
                                                    </div>
                                                    {inquiry.email && (
                                                        <div className="max-w-52 truncate text-xs text-muted-foreground">
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
                                                    <StatusBadge
                                                        status={inquiry.status}
                                                    />
                                                </Td>
                                                <Td>
                                                    <span className="capitalize">
                                                        {inquiry.department}
                                                    </span>
                                                </Td>
                                                <Td className="whitespace-nowrap text-muted-foreground">
                                                    {inquiry.updated_at}
                                                </Td>
                                            </tr>
                                        ))}
                                        {report.inquiries.length === 0 && (
                                            <tr>
                                                <td
                                                    className="p-12 text-center text-muted-foreground"
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
                    <div className="relative max-h-[60vh] overflow-auto rounded-md border">
                        <table className="w-full min-w-[1100px] text-sm">
                            <thead className="sticky top-0 z-10 bg-muted text-muted-foreground shadow-[inset_0_-1px_0_var(--border)]">
                                <tr>
                                    {[
                                        'Name',
                                        'Phone',
                                        'Email',
                                        'Source',
                                        'Program',
                                        'Previous program',
                                        'Campus',
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
                                        className="border-t transition-colors hover:bg-muted/35"
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

            <Dialog
                open={detailOpen}
                onOpenChange={(open) => {
                    setDetailOpen(open);
                    if (!open) {
                        setEditingInquiryDetails(false);
                        setInquiryBeforeEdit(null);
                    }
                }}
            >
                <DialogContent className="h-[92vh] max-h-[92vh] grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden p-0 sm:max-w-7xl">
                    {selected && (
                        <>
                            <DialogHeader className="border-b px-6 py-5 pr-14">
                                <DialogTitle>{selected.name}</DialogTitle>
                                <DialogDescription>
                                    {selected.phone} ·{' '}
                                    {selected.email ?? 'No email'} ·{' '}
                                    {selected.city ?? 'No city'}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid min-h-0 overflow-y-auto lg:grid-cols-[minmax(0,1.1fr)_minmax(390px,0.9fr)] lg:overflow-hidden">
                                <div className="p-5 sm:p-6 lg:overflow-y-auto">
                                    <form
                                        className="space-y-5"
                                        onSubmit={saveInquiryActivity}
                                    >
                                        {!selected.can_update && (
                                            <p className="text-sm text-muted-foreground">
                                                Inquiry fields can only be
                                                changed by{' '}
                                                {selected.assigned_user?.name ??
                                                    'the assigned user'}
                                                . You can still add a discussion
                                                stream.
                                            </p>
                                        )}

                                        {editingInquiryDetails ? (
                                            <div className="space-y-4">
                                                <div className="flex justify-end">
                                                    <Button
                                                        type="button"
                                                        size="icon"
                                                        variant="ghost"
                                                        title="Cancel editing"
                                                        onClick={() => {
                                                            if (
                                                                inquiryBeforeEdit
                                                            ) {
                                                                setSelected(
                                                                    inquiryBeforeEdit,
                                                                );
                                                            }
                                                            setEditingInquiryDetails(
                                                                false,
                                                            );
                                                            setInquiryBeforeEdit(
                                                                null,
                                                            );
                                                        }}
                                                    >
                                                        <X />
                                                    </Button>
                                                </div>
                                                <div className="grid gap-3 md:grid-cols-3">
                                                    <FilterSelect
                                                        label="Status"
                                                        placeholder="Status"
                                                        value={selected.status}
                                                        options={statusOptions}
                                                        onChange={(status) =>
                                                            setSelected({
                                                                ...selected,
                                                                status,
                                                            })
                                                        }
                                                    />
                                                    <FilterSelect
                                                        label="Department"
                                                        placeholder="Department"
                                                        value={
                                                            selected.department
                                                        }
                                                        options={
                                                            departmentOptions
                                                        }
                                                        onChange={(
                                                            department,
                                                        ) =>
                                                            setSelected({
                                                                ...selected,
                                                                department,
                                                            })
                                                        }
                                                    />
                                                    <SelectField
                                                        label="Postal communication"
                                                        placeholder="Postal communication"
                                                        value={
                                                            selected.postal_communication
                                                        }
                                                        options={postalCommunicationOptions.map(
                                                            (option) => ({
                                                                value: option,
                                                                label:
                                                                    option ===
                                                                    'send'
                                                                        ? 'Sent'
                                                                        : 'Pending',
                                                            }),
                                                        )}
                                                        allowEmpty={false}
                                                        onChange={(
                                                            postal_communication,
                                                        ) =>
                                                            setSelected({
                                                                ...selected,
                                                                postal_communication:
                                                                    postal_communication as
                                                                        | 'pending'
                                                                        | 'send',
                                                            })
                                                        }
                                                    />
                                                    <div className="grid gap-2">
                                                        <Label htmlFor="next-follow-up">
                                                            Next follow-up
                                                        </Label>
                                                        <Input
                                                            id="next-follow-up"
                                                            type="date"
                                                            value={
                                                                selected.next_follow_up_at ??
                                                                ''
                                                            }
                                                            onChange={(event) =>
                                                                setSelected({
                                                                    ...selected,
                                                                    next_follow_up_at:
                                                                        event
                                                                            .target
                                                                            .value,
                                                                })
                                                            }
                                                        />
                                                    </div>
                                                </div>
                                                <InquiryDetailsFields
                                                    inquiry={selected}
                                                    programs={programs}
                                                    campuses={activeCampuses}
                                                    onChange={setSelected}
                                                />
                                            </div>
                                        ) : (
                                            <InquiryDetailsSummary
                                                inquiry={selected}
                                                canEdit={selected.can_update}
                                                onEdit={() => {
                                                    setInquiryBeforeEdit({
                                                        ...selected,
                                                    });
                                                    setEditingInquiryDetails(
                                                        true,
                                                    );
                                                }}
                                            />
                                        )}

                                        {selected.can_stream && (
                                            <div className="space-y-2">
                                                <Label htmlFor="stream">
                                                    Discussion stream
                                                    <span className="ml-1 text-destructive">
                                                        *
                                                    </span>
                                                </Label>
                                                <textarea
                                                    id="stream"
                                                    className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                                    value={streamText}
                                                    required
                                                    onChange={(event) =>
                                                        setStreamText(
                                                            event.target.value,
                                                        )
                                                    }
                                                    placeholder="Add the latest discussion or follow-up note"
                                                />
                                            </div>
                                        )}

                                        {inquiryUpdateError && (
                                            <p className="text-sm text-destructive">
                                                {inquiryUpdateError}
                                            </p>
                                        )}

                                        {(selected.can_update ||
                                            selected.can_stream) && (
                                            <DialogFooter className="border-t pt-4">
                                                <Button
                                                    type="submit"
                                                    disabled={updatingInquiry}
                                                >
                                                    <Send />
                                                    {updatingInquiry
                                                        ? 'Saving...'
                                                        : editingInquiryDetails
                                                          ? 'Update inquiry and stream'
                                                          : 'Submit stream'}
                                                </Button>
                                            </DialogFooter>
                                        )}
                                    </form>
                                </div>

                                <section className="space-y-4 border-t bg-muted/10 p-5 sm:p-6 lg:overflow-y-auto lg:border-t-0 lg:border-l">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <h3 className="text-sm font-semibold">
                                                Discussion history
                                            </h3>
                                            <p className="mt-0.5 text-xs text-muted-foreground">
                                                Follow-ups and responses
                                                recorded by employees.
                                            </p>
                                        </div>
                                        <Badge variant="secondary">
                                            {selected.streams.length}{' '}
                                            {selected.streams.length === 1
                                                ? 'response'
                                                : 'responses'}
                                        </Badge>
                                    </div>

                                    <div className="flex max-w-full gap-1 overflow-x-auto rounded-md border bg-muted/35 p-1">
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant={
                                                activeHistory === 'all'
                                                    ? 'secondary'
                                                    : 'ghost'
                                            }
                                            className="shrink-0 shadow-none"
                                            onClick={() =>
                                                setActiveHistory('all')
                                            }
                                        >
                                            All
                                            <span className="text-xs tabular-nums opacity-65">
                                                {selected.streams.length}
                                            </span>
                                        </Button>
                                        {selectedUserTabs.map((userTab) => (
                                            <Button
                                                key={userTab.id}
                                                type="button"
                                                size="sm"
                                                variant={
                                                    activeHistory === userTab.id
                                                        ? 'secondary'
                                                        : 'ghost'
                                                }
                                                className="shrink-0 shadow-none"
                                                onClick={() =>
                                                    setActiveHistory(userTab.id)
                                                }
                                            >
                                                {userTab.name}
                                                <span className="text-xs tabular-nums opacity-65">
                                                    {userTab.count}
                                                </span>
                                            </Button>
                                        ))}
                                    </div>

                                    <div className="relative space-y-3 before:absolute before:top-5 before:bottom-5 before:left-4 before:w-px before:bg-border">
                                        {visibleStreams.map((stream) => (
                                            <article
                                                key={stream.id}
                                                className="relative ml-8 rounded-md border bg-background p-4 shadow-xs"
                                            >
                                                <div className="flex flex-wrap items-start justify-between gap-2">
                                                    <div className="flex min-w-0 items-center gap-2">
                                                        <span className="absolute top-4 -left-8 z-10 flex size-8 shrink-0 items-center justify-center rounded-full border bg-background text-xs font-semibold text-foreground shadow-xs">
                                                            {employeeInitials(
                                                                stream.user
                                                                    ?.name,
                                                            )}
                                                        </span>
                                                        <div className="min-w-0">
                                                            <p className="truncate text-sm font-medium">
                                                                {stream.user
                                                                    ?.name ??
                                                                    'Unknown user'}
                                                            </p>
                                                            <p className="flex items-center gap-1 text-xs text-muted-foreground">
                                                                <CalendarClock className="size-3" />
                                                                {
                                                                    stream.created_at
                                                                }
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <StreamStatusBadge
                                                        status={
                                                            stream.last_status
                                                        }
                                                    />
                                                </div>

                                                <div className="mt-3 rounded-md border-l-2 border-l-primary/45 bg-muted/35 px-3.5 py-3">
                                                    <p className="text-sm leading-6 break-words whitespace-pre-wrap text-foreground">
                                                        {stream.response}
                                                    </p>
                                                </div>
                                            </article>
                                        ))}
                                        {visibleStreams.length === 0 && (
                                            <div className="relative ml-8 rounded-md border border-dashed bg-muted/20 p-6 text-center">
                                                <MessageSquarePlus className="mx-auto size-5 text-muted-foreground" />
                                                <p className="mt-2 text-sm font-medium">
                                                    No discussion history
                                                </p>
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    Responses will appear here
                                                    after they are submitted.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </section>
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
    canSelectAssignee,
    canChangeDepartment,
    onChange,
    onSubmit,
}: {
    form: InquiryForm;
    programs: Option[];
    campuses: Option[];
    teamMembers: TeamMember[];
    statusOptions: string[];
    departmentOptions: string[];
    canSelectAssignee: boolean;
    canChangeDepartment: boolean;
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
                    disabled={!canSelectAssignee}
                    onChange={(assigned_user_id) => {
                        const assignee = teamMembers.find(
                            (member) => String(member.id) === assigned_user_id,
                        );
                        onChange({
                            ...form,
                            assigned_user_id,
                            department: assignee?.department ?? form.department,
                        });
                    }}
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
                    disabled={!canChangeDepartment}
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

function InquiryDetailsFields({
    inquiry,
    programs,
    campuses,
    onChange,
}: {
    inquiry: Inquiry;
    programs: Option[];
    campuses: Option[];
    onChange: (inquiry: Inquiry) => void;
}) {
    return (
        <div className="space-y-4 rounded-md border p-4">
            <div className="grid gap-3 md:grid-cols-2">
                <Field
                    label="Name"
                    value={inquiry.name}
                    required
                    onChange={(name) => onChange({ ...inquiry, name })}
                />
                <Field
                    label="Phone"
                    value={inquiry.phone}
                    required
                    onChange={(phone) => onChange({ ...inquiry, phone })}
                />
                <Field
                    label="Email"
                    type="email"
                    value={inquiry.email ?? ''}
                    onChange={(email) => onChange({ ...inquiry, email })}
                />
                <Field
                    label="City"
                    value={inquiry.city ?? ''}
                    onChange={(city) => onChange({ ...inquiry, city })}
                />
                <Field
                    label="Source"
                    value={inquiry.source ?? ''}
                    onChange={(source) => onChange({ ...inquiry, source })}
                />
                <Field
                    label="Previous program"
                    value={inquiry.previous_program ?? ''}
                    onChange={(previous_program) =>
                        onChange({ ...inquiry, previous_program })
                    }
                />
                <SelectField
                    label="Program"
                    value={String(inquiry.program_id ?? '')}
                    placeholder="No program"
                    options={programs.map((program) => ({
                        value: String(program.id),
                        label: program.name,
                    }))}
                    onChange={(programId) =>
                        onChange({
                            ...inquiry,
                            program_id: programId ? Number(programId) : null,
                        })
                    }
                />
                <SelectField
                    label="Campus"
                    value={String(inquiry.campus_id ?? '')}
                    placeholder="No campus"
                    options={campuses.map((campus) => ({
                        value: String(campus.id),
                        label: campus.name,
                    }))}
                    onChange={(campusId) =>
                        onChange({
                            ...inquiry,
                            campus_id: campusId ? Number(campusId) : null,
                        })
                    }
                />
            </div>
            <div className="grid gap-2">
                <Label>Address</Label>
                <textarea
                    className="min-h-20 rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    value={inquiry.address ?? ''}
                    onChange={(event) =>
                        onChange({ ...inquiry, address: event.target.value })
                    }
                />
            </div>
            <div className="grid gap-2">
                <Label>Initial message</Label>
                <textarea
                    className="min-h-20 rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    value={inquiry.message ?? ''}
                    onChange={(event) =>
                        onChange({ ...inquiry, message: event.target.value })
                    }
                />
            </div>
            <Info
                label="Assigned user"
                value={inquiry.assigned_user?.name ?? 'Unassigned'}
            />
        </div>
    );
}

function InquiryDetailsSummary({
    inquiry,
    canEdit,
    onEdit,
}: {
    inquiry: Inquiry;
    canEdit: boolean;
    onEdit: () => void;
}) {
    return (
        <section className="rounded-md border">
            <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
                <div>
                    <h3 className="text-sm font-semibold">Inquiry details</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                        Student, program, assignment, and follow-up information
                    </p>
                </div>
                <div className="flex items-center gap-1">
                    {inquiry.postal_communication === 'send' && (
                        <Button
                            asChild
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="text-primary"
                            title="Download invitation letter PDF"
                        >
                            <a
                                href={`/inquiries/${inquiry.id}/invitation-letter.pdf`}
                                aria-label={`Download invitation letter for ${inquiry.name}`}
                            >
                                <FileDown />
                            </a>
                        </Button>
                    )}
                    {canEdit && (
                        <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            title="Edit inquiry details"
                            onClick={onEdit}
                        >
                            <PenLine />
                        </Button>
                    )}
                </div>
            </div>
            <div className="grid gap-x-6 gap-y-4 p-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
                <Info label="Name" value={inquiry.name} />
                <Info label="Phone" value={inquiry.phone} />
                <Info label="Email" value={inquiry.email ?? 'Not set'} />
                <Info label="City" value={inquiry.city ?? 'Not set'} />
                <Info label="Source" value={inquiry.source ?? 'Not set'} />
                <Info
                    label="Program"
                    value={inquiry.program?.name ?? 'No program'}
                />
                <Info
                    label="Previous program"
                    value={inquiry.previous_program ?? 'Not set'}
                />
                <Info
                    label="Campus"
                    value={
                        inquiry.campus_model?.name ??
                        inquiry.campus ??
                        'Not set'
                    }
                />
                <Info
                    label="Assigned user"
                    value={inquiry.assigned_user?.name ?? 'Unassigned'}
                />
                <Info label="Status" value={inquiry.status} />
                <Info label="Department" value={inquiry.department} />
                <Info
                    label="Postal communication"
                    value={
                        inquiry.postal_communication === 'send'
                            ? 'Sent'
                            : 'Pending'
                    }
                />
                <Info
                    label="Next follow-up"
                    value={inquiry.next_follow_up_at ?? 'Not scheduled'}
                />
                <Info label="Address" value={inquiry.address ?? 'Not set'} />
                <Info
                    label="Initial message"
                    value={inquiry.message ?? 'Not set'}
                />
            </div>
        </section>
    );
}

function Metric({ label, value }: { label: string; value: number }) {
    return (
        <div className="crm-metric">
            <div className="text-xs font-medium text-muted-foreground uppercase">
                {label}
            </div>
            <div className="mt-1 text-2xl font-semibold tabular-nums">
                {value}
            </div>
        </div>
    );
}

function ReportSummary({
    label,
    value,
    primary = false,
}: {
    label: string;
    value: number;
    primary?: boolean;
}) {
    return (
        <div
            className={[
                'min-w-0 rounded-md border px-3 py-2.5',
                primary ? 'border-primary/30 bg-primary/5' : 'bg-muted/25',
            ].join(' ')}
        >
            <div className="truncate text-xs text-muted-foreground capitalize">
                {label}
            </div>
            <div className="mt-0.5 text-xl font-semibold tabular-nums">
                {value}
            </div>
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
                    <ChevronLeft />
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
                    <ChevronRight />
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

function SearchSuggestionPanel({
    loading,
    results,
    onSelect,
}: {
    loading: boolean;
    results: Inquiry[];
    onSelect: (inquiry: Inquiry) => void;
}) {
    return (
        <div className="absolute top-full right-0 left-0 z-40 mt-2 overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-lg">
            <div className="border-b px-3 py-2 text-xs font-medium text-muted-foreground">
                Related inquiries
            </div>
            <div className="max-h-80 overflow-y-auto p-1.5">
                {results.map((inquiry) => (
                    <button
                        key={inquiry.id}
                        type="button"
                        className="flex w-full items-start gap-3 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
                        onClick={() => onSelect(inquiry)}
                    >
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-semibold text-primary">
                            {employeeInitials(inquiry.name)}
                        </span>
                        <span className="min-w-0 flex-1">
                            <span className="flex flex-wrap items-center justify-between gap-2">
                                <span className="truncate text-sm font-medium">
                                    {inquiry.name}
                                </span>
                                <StatusBadge status={inquiry.status} />
                            </span>
                            <span className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                <span className="inline-flex items-center gap-1">
                                    <Phone className="size-3" />
                                    {inquiry.phone}
                                </span>
                                {inquiry.email && (
                                    <span className="inline-flex min-w-0 items-center gap-1">
                                        <Mail className="size-3" />
                                        <span className="truncate">
                                            {inquiry.email}
                                        </span>
                                    </span>
                                )}
                            </span>
                            <span className="mt-1 block truncate text-xs text-muted-foreground">
                                {inquiry.campus_model?.name ??
                                    inquiry.campus ??
                                    'No campus'}
                                {' | '}
                                {inquiry.assigned_user?.name ?? 'Unassigned'}
                            </span>
                        </span>
                    </button>
                ))}

                {!loading && results.length === 0 && (
                    <div className="px-3 py-6 text-center">
                        <Search className="mx-auto size-5 text-muted-foreground" />
                        <p className="mt-2 text-sm font-medium">
                            No related inquiries
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Try another name, phone number, or email.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

function FilterSelect({
    label,
    placeholder,
    value,
    options,
    counts,
    disabled = false,
    onChange,
}: {
    label?: string;
    placeholder: string;
    value: string;
    options: string[];
    counts?: Record<string, number>;
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
                            {counts && ` (${counts[option] ?? 0})`}
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
    disabled = false,
    allowEmpty = true,
    onChange,
}: {
    label: string;
    value: string;
    placeholder: string;
    options: { value: string; label: string }[];
    disabled?: boolean;
    allowEmpty?: boolean;
    onChange: (value: string) => void;
}) {
    return (
        <div className="grid gap-2">
            <Label>{label}</Label>
            <Select
                value={value || 'none'}
                disabled={disabled}
                onValueChange={(next) => onChange(next === 'none' ? '' : next)}
            >
                <SelectTrigger className="w-full">
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                    {allowEmpty && (
                        <SelectItem value="none">{placeholder}</SelectItem>
                    )}
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

function StatusBadge({ status }: { status: string }) {
    const tone = statusTone(status);

    return (
        <Badge
            variant="outline"
            className={`border px-2 py-0.5 font-medium whitespace-nowrap capitalize ${tone}`}
        >
            {status}
        </Badge>
    );
}

function StreamStatusBadge({ status }: { status: string | null }) {
    if (!status) {
        return (
            <Badge variant="outline" className="text-muted-foreground">
                Status unavailable
            </Badge>
        );
    }

    return (
        <Badge
            variant="outline"
            className={`border px-2 py-0.5 whitespace-nowrap capitalize ${statusTone(status)}`}
        >
            Status: {status}
        </Badge>
    );
}

function employeeInitials(name?: string): string {
    if (!name) return '?';

    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join('');
}

function statusTone(status: string): string {
    if (
        ['interested', 'will visit', 'visited', 'admission fee paid'].includes(
            status,
        )
    ) {
        return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300';
    }

    if (['pending', 'call back', 'not sure'].includes(status)) {
        return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300';
    }

    if (['not interested', 'not eligible', 'not responding'].includes(status)) {
        return 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300';
    }

    return 'border-border bg-muted/60 text-foreground';
}

function Th({ children }: { children?: ReactNode }) {
    return (
        <th className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap">
            {children}
        </th>
    );
}

function Td({
    children,
    className = '',
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <td className={`px-4 py-3.5 align-middle ${className}`}>{children}</td>
    );
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
): InquiryForm {
    const programName = row.program ?? row.program_name ?? '';
    const campusName =
        row.campus ?? row.campus_name ?? row.branch ?? row.location ?? '';

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
        assigned_user_id: '',
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
