import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    CalendarClock,
    Eye,
    FileSpreadsheet,
    Filter,
    MessageSquarePlus,
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
    status: string;
    assigned_user_id: string;
    department: string;
    next_follow_up_at: string;
    message: string;
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
    status: 'pending',
    assigned_user_id: '',
    department: 'admission',
    next_follow_up_at: '',
    message: '',
};

export default function Dashboard({
    pageTitle,
    pageUrl,
    filters,
    inquiries,
    programs,
    teamMembers,
    sourceOptions,
    statusOptions,
    departmentOptions,
    crmPermissions,
}: {
    pageTitle: string;
    pageUrl: string;
    filters: Record<string, string>;
    inquiries: Inquiry[];
    programs: Option[];
    teamMembers: Option[];
    sourceOptions: string[];
    statusOptions: string[];
    departmentOptions: string[];
    crmPermissions: {
        canCreateInquiry: boolean;
        canImportInquiry: boolean;
        canAssignInquiry: boolean;
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

    const selectedUserTabs = useMemo(() => {
        const users = new Map<string, string>();
        selected?.streams.forEach((stream) => {
            if (stream.user) users.set(String(stream.user.id), stream.user.name);
        });

        return [...users.entries()];
    }, [selected]);

    const visibleStreams =
        activeHistory === 'all'
            ? (selected?.streams ?? [])
            : (selected?.streams.filter((stream) => String(stream.user?.id) === activeHistory) ?? []);

    const allVisibleSelected =
        inquiries.length > 0 && inquiries.every((inquiry) => selectedInquiryIds.includes(inquiry.id));

    useEffect(() => {
        if (!selected) return;

        setSelected(inquiries.find((inquiry) => inquiry.id === selected.id) ?? selected);
    }, [inquiries, selected]);

    useEffect(() => {
        const visibleIds = new Set(inquiries.map((inquiry) => inquiry.id));
        setSelectedInquiryIds((current) => current.filter((id) => visibleIds.has(id)));
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
            checked ? [...new Set([...current, inquiryId])] : current.filter((id) => id !== inquiryId),
        );
    };

    const toggleAllVisibleInquiries = (checked: boolean) => {
        setSelectedInquiryIds(checked ? inquiries.map((inquiry) => inquiry.id) : []);
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
            .map((row) => csvRowToInquiry(row, programs, teamMembers))
            .filter((row) => row.name || row.phone || row.email);

        setImportRows(rows);
        setImportOpen(true);
    };

    return (
        <>
            <Head title={pageTitle} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto p-4">
                <div className="flex flex-col gap-1">
                    <h1 className="text-xl font-semibold">{pageTitle}</h1>
                    <p className="text-muted-foreground text-sm">
                        Review, filter, assign, and follow up on inquiries.
                    </p>
                </div>

                <div className="grid gap-3 md:grid-cols-4">
                    <Metric label="Total inquiries" value={inquiries.length} />
                    <Metric label="Pending" value={inquiries.filter((item) => item.status === 'pending').length} />
                    <Metric label="Follow ups" value={inquiries.filter((item) => item.next_follow_up_at).length} />
                    <Metric label="My assigned" value={inquiries.filter((item) => item.can_update).length} />
                </div>

                <div className="rounded-lg border bg-background">
                    <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center lg:justify-between">
                        <form className="grid flex-1 gap-2 md:grid-cols-[1.4fr_1fr_1fr_1fr_1fr_0.8fr_0.8fr_auto]" onSubmit={submitFilters}>
                            <div className="relative">
                                <Search className="text-muted-foreground absolute top-2.5 left-3 size-4" />
                                <Input
                                    className="pl-9"
                                    placeholder="Search name, phone, email, city"
                                    value={filterForm.search ?? ''}
                                    onChange={(event) => setFilterForm({ ...filterForm, search: event.target.value })}
                                />
                            </div>
                            <FilterSelect
                                placeholder="Status"
                                value={filterForm.status ?? ''}
                                options={statusOptions}
                                onChange={(status) => setFilterForm({ ...filterForm, status })}
                            />
                            <FilterSelect
                                placeholder="Department"
                                value={filterForm.department ?? ''}
                                options={departmentOptions}
                                onChange={(department) => setFilterForm({ ...filterForm, department })}
                            />
                            <Select
                                value={filterForm.assigned_user_id || 'all'}
                                onValueChange={(value) =>
                                    setFilterForm({ ...filterForm, assigned_user_id: value === 'all' ? '' : value })
                                }
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Assigned user" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All users</SelectItem>
                                    {teamMembers.map((member) => (
                                        <SelectItem key={member.id} value={String(member.id)}>
                                            {member.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FilterSelect
                                placeholder="Source"
                                value={filterForm.source ?? ''}
                                options={sourceOptions}
                                onChange={(source) => setFilterForm({ ...filterForm, source })}
                            />
                            <Input
                                type="date"
                                aria-label="From date"
                                value={filterForm.date_from ?? ''}
                                onChange={(event) => setFilterForm({ ...filterForm, date_from: event.target.value })}
                            />
                            <Input
                                type="date"
                                aria-label="To date"
                                value={filterForm.date_to ?? ''}
                                onChange={(event) => setFilterForm({ ...filterForm, date_to: event.target.value })}
                            />
                            <Button type="submit" variant="outline">
                                <Filter />
                                Apply
                            </Button>
                        </form>

                        <div className="flex gap-2">
                            {crmPermissions.canImportInquiry && (
                                <>
                                    <input
                                        ref={csvInputRef}
                                        className="hidden"
                                        type="file"
                                        accept=".csv,text/csv"
                                        onChange={(event) => void handleCsv(event.target.files?.[0])}
                                    />
                                    <Button type="button" variant="outline" onClick={() => csvInputRef.current?.click()}>
                                        <Upload />
                                        CSV
                                    </Button>
                                </>
                            )}
                            {crmPermissions.canCreateInquiry && (
                                <Button type="button" onClick={() => setCreateOpen(true)}>
                                    <Plus />
                                    Add
                                </Button>
                            )}
                        </div>
                    </div>

                    {crmPermissions.canAssignInquiry && (
                        <div className="flex flex-col gap-2 border-b bg-muted/20 p-4 md:flex-row md:items-center">
                            <div className="text-muted-foreground text-sm">
                                {selectedInquiryIds.length} selected
                            </div>
                            <Select
                                value={bulkAssignedUserId || 'none'}
                                onValueChange={(value) => setBulkAssignedUserId(value === 'none' ? '' : value)}
                            >
                                <SelectTrigger className="w-full md:w-64">
                                    <SelectValue placeholder="Assign to user" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Select user</SelectItem>
                                    {teamMembers.map((member) => (
                                        <SelectItem key={member.id} value={String(member.id)}>
                                            {member.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button
                                type="button"
                                disabled={selectedInquiryIds.length === 0 || !bulkAssignedUserId}
                                onClick={assignSelectedInquiries}
                            >
                                <UserCheck />
                                Assign
                            </Button>
                        </div>
                    )}

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1040px] text-sm">
                            <thead className="bg-muted/60 text-muted-foreground">
                                <tr>
                                    {crmPermissions.canAssignInquiry && (
                                        <Th>
                                            <Checkbox
                                                checked={allVisibleSelected}
                                                aria-label="Select all inquiries"
                                                onCheckedChange={(checked) => toggleAllVisibleInquiries(checked === true)}
                                            />
                                        </Th>
                                    )}
                                    <Th>Name</Th>
                                    <Th>Source</Th>
                                    <Th>Program</Th>
                                    <Th>Assigned</Th>
                                    <Th>Status</Th>
                                    <Th>Department</Th>
                                    <Th>Follow up</Th>
                                    <Th>Last discussion</Th>
                                    <Th></Th>
                                </tr>
                            </thead>
                            <tbody>
                                {inquiries.map((inquiry) => (
                                    <tr key={inquiry.id} className="border-t">
                                        {crmPermissions.canAssignInquiry && (
                                            <Td>
                                                <Checkbox
                                                    checked={selectedInquiryIds.includes(inquiry.id)}
                                                    aria-label={`Select ${inquiry.name}`}
                                                    onCheckedChange={(checked) =>
                                                        toggleSelectedInquiry(inquiry.id, checked === true)
                                                    }
                                                />
                                            </Td>
                                        )}
                                        <Td>
                                            <div className="font-medium">{inquiry.name}</div>
                                            <div className="text-muted-foreground">{inquiry.phone}</div>
                                            {inquiry.email && <div className="text-muted-foreground">{inquiry.email}</div>}
                                        </Td>
                                        <Td>{inquiry.source || 'Not set'}</Td>
                                        <Td>{inquiry.program?.name ?? inquiry.previous_program ?? 'No program'}</Td>
                                        <Td>{inquiry.assigned_user?.name ?? 'Unassigned'}</Td>
                                        <Td>
                                            <Badge variant={inquiry.status === 'pending' ? 'secondary' : 'outline'}>
                                                {inquiry.status}
                                            </Badge>
                                        </Td>
                                        <Td>{inquiry.department}</Td>
                                        <Td>
                                            <span className="inline-flex items-center gap-1">
                                                <CalendarClock className="text-muted-foreground size-4" />
                                                {inquiry.next_follow_up_at ?? 'Not set'}
                                            </span>
                                        </Td>
                                        <Td className="max-w-[260px] truncate">
                                            {inquiry.streams[0]?.response ?? inquiry.message ?? 'No discussion yet'}
                                        </Td>
                                        <Td className="text-right">
                                            <Button type="button" variant="ghost" size="sm" onClick={() => openDetail(inquiry)}>
                                                <Eye />
                                                View
                                            </Button>
                                        </Td>
                                    </tr>
                                ))}
                                {inquiries.length === 0 && (
                                    <tr>
                                        <td
                                            className="text-muted-foreground p-8 text-center"
                                            colSpan={crmPermissions.canAssignInquiry ? 10 : 9}
                                        >
                                            No inquiries found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Add inquiry</DialogTitle>
                        <DialogDescription>Manual inquiries use the same fields as CSV imports.</DialogDescription>
                    </DialogHeader>
                    <InquiryFormFields
                        form={newInquiry}
                        programs={programs}
                        teamMembers={teamMembers}
                        statusOptions={statusOptions}
                        departmentOptions={departmentOptions}
                        onChange={setNewInquiry}
                        onSubmit={submitInquiry}
                    />
                </DialogContent>
            </Dialog>

            <Dialog open={importOpen} onOpenChange={setImportOpen}>
                <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-6xl">
                    <DialogHeader>
                        <DialogTitle>Review CSV import</DialogTitle>
                        <DialogDescription>Check the table before submitting inquiries to the dashboard.</DialogDescription>
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
                                        'Assigned',
                                        'Status',
                                        'Department',
                                        'Follow up',
                                    ].map(
                                        (heading) => (
                                            <Th key={heading}>{heading}</Th>
                                        ),
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {importRows.map((row, index) => (
                                    <tr key={`${row.email}-${index}`} className="border-t">
                                        <Td>{row.name}</Td>
                                        <Td>{row.phone}</Td>
                                        <Td>{row.email}</Td>
                                        <Td>{row.source}</Td>
                                        <Td>{programs.find((program) => String(program.id) === row.program_id)?.name}</Td>
                                        <Td>{teamMembers.find((member) => String(member.id) === row.assigned_user_id)?.name}</Td>
                                        <Td>{row.status}</Td>
                                        <Td>{row.department}</Td>
                                        <Td>{row.next_follow_up_at}</Td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setImportOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="button" disabled={importRows.length === 0} onClick={submitImport}>
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
                                    {selected.phone} · {selected.email ?? 'No email'} · {selected.city ?? 'No city'}
                                </DialogDescription>
                            </DialogHeader>

                            <form className="grid gap-3 md:grid-cols-3" onSubmit={updateInquiry}>
                                <FilterSelect
                                    placeholder="Status"
                                    value={selected.status}
                                    options={statusOptions}
                                    disabled={!selected.can_update}
                                    onChange={(status) => setSelected({ ...selected, status })}
                                />
                                <FilterSelect
                                    placeholder="Department"
                                    value={selected.department}
                                    options={departmentOptions}
                                    disabled={!selected.can_update}
                                    onChange={(department) => setSelected({ ...selected, department })}
                                />
                                <Input
                                    type="date"
                                    value={selected.next_follow_up_at ?? ''}
                                    disabled={!selected.can_update}
                                    onChange={(event) =>
                                        setSelected({ ...selected, next_follow_up_at: event.target.value })
                                    }
                                />
                                <div className="md:col-span-3">
                                    <Button type="submit" disabled={!selected.can_update}>
                                        Update inquiry
                                    </Button>
                                    {!selected.can_update && (
                                        <span className="text-muted-foreground ml-3 text-sm">
                                            Only {selected.assigned_user?.name ?? 'the assigned user'} can change these fields.
                                        </span>
                                    )}
                                </div>
                            </form>

                            <div className="grid gap-3 rounded-md border p-3 text-sm md:grid-cols-2">
                                <Info label="Program" value={selected.program?.name ?? selected.previous_program ?? 'No program'} />
                                <Info label="Source" value={selected.source ?? 'Not set'} />
                                <Info label="Assigned user" value={selected.assigned_user?.name ?? 'Unassigned'} />
                                <Info label="Address" value={selected.address ?? 'No address'} />
                                <Info label="Initial message" value={selected.message ?? 'No initial message'} />
                            </div>

                            <form className="space-y-2" onSubmit={submitStream}>
                                <Label htmlFor="stream">Discussion stream</Label>
                                <textarea
                                    id="stream"
                                    className="border-input focus-visible:border-ring focus-visible:ring-ring/50 min-h-24 w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-[3px]"
                                    value={streamText}
                                    onChange={(event) => setStreamText(event.target.value)}
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
                                        variant={activeHistory === 'all' ? 'default' : 'outline'}
                                        onClick={() => setActiveHistory('all')}
                                    >
                                        All
                                    </Button>
                                    {selectedUserTabs.map(([id, name]) => (
                                        <Button
                                            key={id}
                                            type="button"
                                            size="sm"
                                            variant={activeHistory === id ? 'default' : 'outline'}
                                            onClick={() => setActiveHistory(id)}
                                        >
                                            {name}
                                        </Button>
                                    ))}
                                </div>
                                <div className="space-y-2">
                                    {visibleStreams.map((stream) => (
                                        <div key={stream.id} className="rounded-md border p-3">
                                            <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                                                <MessageSquarePlus className="size-4" />
                                                <span>{stream.user?.name ?? 'Unknown user'}</span>
                                                <span>{stream.created_at}</span>
                                            </div>
                                            <p className="text-sm">{stream.response}</p>
                                        </div>
                                    ))}
                                    {visibleStreams.length === 0 && (
                                        <div className="text-muted-foreground rounded-md border p-4 text-sm">
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
    teamMembers,
    statusOptions,
    departmentOptions,
    onChange,
    onSubmit,
}: {
    form: InquiryForm;
    programs: Option[];
    teamMembers: Option[];
    statusOptions: string[];
    departmentOptions: string[];
    onChange: (form: InquiryForm) => void;
    onSubmit: (event: FormEvent) => void;
}) {
    return (
        <form className="grid gap-4" onSubmit={onSubmit}>
            <div className="grid gap-3 md:grid-cols-2">
                <Field label="Name" value={form.name} onChange={(name) => onChange({ ...form, name })} required />
                <Field label="Phone" value={form.phone} onChange={(phone) => onChange({ ...form, phone })} required />
                <Field label="Email" type="email" value={form.email} onChange={(email) => onChange({ ...form, email })} />
                <Field label="City" value={form.city} onChange={(city) => onChange({ ...form, city })} />
                <Field label="Source" value={form.source} onChange={(source) => onChange({ ...form, source })} />
                <SelectField
                    label="Program"
                    value={form.program_id}
                    placeholder="No program"
                    options={programs.map((program) => ({ value: String(program.id), label: program.name }))}
                    onChange={(program_id) => onChange({ ...form, program_id })}
                />
                <Field
                    label="Previous program"
                    value={form.previous_program}
                    onChange={(previous_program) => onChange({ ...form, previous_program })}
                />
                <SelectField
                    label="Assigned user"
                    value={form.assigned_user_id}
                    placeholder="Unassigned"
                    options={teamMembers.map((member) => ({ value: String(member.id), label: member.name }))}
                    onChange={(assigned_user_id) => onChange({ ...form, assigned_user_id })}
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
                    onChange={(next_follow_up_at) => onChange({ ...form, next_follow_up_at })}
                />
            </div>
            <div className="grid gap-2">
                <Label>Address</Label>
                <textarea
                    className="border-input focus-visible:border-ring focus-visible:ring-ring/50 min-h-20 rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-[3px]"
                    value={form.address}
                    onChange={(event) => onChange({ ...form, address: event.target.value })}
                />
            </div>
            <div className="grid gap-2">
                <Label>Initial message</Label>
                <textarea
                    className="border-input focus-visible:border-ring focus-visible:ring-ring/50 min-h-20 rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-[3px]"
                    value={form.message}
                    onChange={(event) => onChange({ ...form, message: event.target.value })}
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
            <div className="text-muted-foreground text-sm">{label}</div>
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
            <Input type={type} value={value} required={required} onChange={(event) => onChange(event.target.value)} />
        </div>
    );
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
            <Select value={value || 'all'} disabled={disabled} onValueChange={(next) => onChange(next === 'all' ? '' : next)}>
                <SelectTrigger className="w-full">
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                    {!label && <SelectItem value="all">All {placeholder.toLowerCase()}</SelectItem>}
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
            <Select value={value || 'none'} onValueChange={(next) => onChange(next === 'none' ? '' : next)}>
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
            <div className="text-muted-foreground text-xs">{label}</div>
            <div>{value}</div>
        </div>
    );
}

function Th({ children }: { children?: ReactNode }) {
    return <th className="px-4 py-3 text-left font-medium">{children}</th>;
}

function Td({ children, className = '' }: { children: ReactNode; className?: string }) {
    return <td className={`px-4 py-3 align-top ${className}`}>{children}</td>;
}

function cleanPayload(payload: Record<string, string>) {
    return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== ''));
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

    const headers = rows.shift()?.map((header) => header.toLowerCase().trim().replace(/\s+/g, '_')) ?? [];

    return rows
        .filter((items) => items.some(Boolean))
        .map((items) => Object.fromEntries(headers.map((header, index) => [header, items[index] ?? ''])));
}

function csvRowToInquiry(row: Record<string, string>, programs: Option[], teamMembers: Option[]): InquiryForm {
    const programName = row.program ?? row.program_name ?? '';
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
            String(programs.find((program) => program.name.toLowerCase() === programName.toLowerCase())?.id ?? ''),
        previous_program: row.previous_program ?? '',
        status: row.status || 'pending',
        assigned_user_id:
            row.assigned_user_id ??
            String(teamMembers.find((member) => member.name.toLowerCase() === assignedName.toLowerCase())?.id ?? ''),
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
