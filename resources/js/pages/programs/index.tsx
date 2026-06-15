import { Head, router } from '@inertiajs/react';
import { Edit3, GraduationCap, Plus, Search, Trash2 } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

type Program = {
    id: number;
    name: string;
    duration: string | null;
    fee: string;
    inquiries_count: number;
    created_at: string | null;
    can_delete: boolean;
};

type ProgramForm = {
    name: string;
    duration: string;
    fee: string;
};

const emptyProgram: ProgramForm = {
    name: '',
    duration: '',
    fee: '',
};

export default function ProgramsIndex({
    filters,
    programs,
    metrics,
}: {
    filters: { search: string };
    programs: Program[];
    metrics: {
        total: number;
        withInquiries: number;
        unused: number;
    };
}) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingProgram, setEditingProgram] = useState<Program | null>(null);
    const [form, setForm] = useState<ProgramForm>(emptyProgram);

    const submitSearch = (event: FormEvent) => {
        event.preventDefault();
        router.get('/programs', search ? { search } : {}, {
            preserveState: true,
            replace: true,
        });
    };

    const openCreate = () => {
        setEditingProgram(null);
        setForm(emptyProgram);
        setModalOpen(true);
    };

    const openEdit = (program: Program) => {
        setEditingProgram(program);
        setForm({
            name: program.name,
            duration: program.duration ?? '',
            fee: program.fee,
        });
        setModalOpen(true);
    };

    const submitProgram = (event: FormEvent) => {
        event.preventDefault();
        const payload = {
            name: form.name,
            duration: form.duration || null,
            fee: form.fee,
        };

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                setModalOpen(false);
                setEditingProgram(null);
                setForm(emptyProgram);
            },
        };

        if (editingProgram) {
            router.patch(`/programs/${editingProgram.id}`, payload, options);

            return;
        }

        router.post('/programs', payload, options);
    };

    const deleteProgram = (program: Program) => {
        if (!program.can_delete) {
            return;
        }

        router.delete(`/programs/${program.id}`, {
            preserveScroll: true,
        });
    };

    return (
        <>
            <Head title="Programs" />
            <div className="crm-page">
                <div className="crm-page-header">
                    <div>
                        <h1 className="crm-page-title">Programs</h1>
                        <p className="crm-page-description">
                            Manage course/program options used by inquiries.
                        </p>
                    </div>
                    <Button type="button" onClick={openCreate}>
                        <Plus />
                        Add program
                    </Button>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                    <Metric label="Total programs" value={metrics.total} />
                    <Metric
                        label="Used by inquiries"
                        value={metrics.withInquiries}
                    />
                    <Metric label="Unused" value={metrics.unused} />
                </div>

                <div className="crm-panel">
                    <div className="flex flex-col gap-3 border-b p-4 md:flex-row md:items-center md:justify-between">
                        <form
                            className="relative w-full md:max-w-md"
                            onSubmit={submitSearch}
                        >
                            <Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
                            <Input
                                className="pl-9"
                                value={search}
                                placeholder="Search programs or duration"
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                            />
                        </form>
                    </div>

                    <div className="relative overflow-x-auto">
                        <table className="w-full min-w-[760px] text-sm">
                            <thead className="bg-muted text-muted-foreground">
                                <tr>
                                    <Th>Program</Th>
                                    <Th>Duration</Th>
                                    <Th>Fee</Th>
                                    <Th>Inquiries</Th>
                                    <Th>Created</Th>
                                    <Th></Th>
                                </tr>
                            </thead>
                            <tbody>
                                {programs.map((program) => (
                                    <tr
                                        key={program.id}
                                        className="crm-table-row"
                                    >
                                        <Td>
                                            <div className="flex items-center gap-2 font-semibold">
                                                <span className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                                                    <GraduationCap className="size-4" />
                                                </span>
                                                {program.name}
                                            </div>
                                        </Td>
                                        <Td>{program.duration || 'Not set'}</Td>
                                        <Td>{formatMoney(program.fee)}</Td>
                                        <Td>
                                            <Badge
                                                variant={
                                                    program.inquiries_count > 0
                                                        ? 'secondary'
                                                        : 'outline'
                                                }
                                            >
                                                {program.inquiries_count}
                                            </Badge>
                                        </Td>
                                        <Td>
                                            {program.created_at ??
                                                'Not available'}
                                        </Td>
                                        <Td>
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        openEdit(program)
                                                    }
                                                >
                                                    <Edit3 />
                                                    Edit
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={
                                                        !program.can_delete
                                                    }
                                                    onClick={() =>
                                                        deleteProgram(program)
                                                    }
                                                >
                                                    <Trash2 />
                                                    Delete
                                                </Button>
                                            </div>
                                        </Td>
                                    </tr>
                                ))}
                                {programs.length === 0 && (
                                    <tr>
                                        <td
                                            className="p-8 text-center text-muted-foreground"
                                            colSpan={6}
                                        >
                                            <div className="font-medium text-foreground">
                                                No programs found
                                            </div>
                                            <div className="mt-1 text-sm">
                                                Create a program or adjust your
                                                search.
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingProgram ? 'Edit program' : 'Add program'}
                        </DialogTitle>
                        <DialogDescription>
                            Program names appear in inquiry forms and CSV
                            imports.
                        </DialogDescription>
                    </DialogHeader>
                    <form className="space-y-4" onSubmit={submitProgram}>
                        <Field
                            label="Program name"
                            value={form.name}
                            required
                            onChange={(name) => setForm({ ...form, name })}
                        />
                        <Field
                            label="Duration"
                            value={form.duration}
                            placeholder="Example: 3 months"
                            onChange={(duration) =>
                                setForm({ ...form, duration })
                            }
                        />
                        <Field
                            label="Fee"
                            type="number"
                            min="0"
                            step="0.01"
                            value={form.fee}
                            required
                            onChange={(fee) => setForm({ ...form, fee })}
                        />
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setModalOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit">
                                {editingProgram
                                    ? 'Save changes'
                                    : 'Create program'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
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

function Field({
    label,
    value,
    onChange,
    type = 'text',
    required = false,
    placeholder,
    min,
    step,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    type?: string;
    required?: boolean;
    placeholder?: string;
    min?: string;
    step?: string;
}) {
    return (
        <div className="grid gap-2">
            <Label>{label}</Label>
            <Input
                type={type}
                value={value}
                required={required}
                placeholder={placeholder}
                min={min}
                step={step}
                onChange={(event) => onChange(event.target.value)}
            />
        </div>
    );
}

function Th({ children }: { children?: React.ReactNode }) {
    return (
        <th className="px-4 py-3 text-left text-xs font-semibold">
            {children}
        </th>
    );
}

function Td({ children }: { children: React.ReactNode }) {
    return <td className="px-4 py-3.5 align-middle">{children}</td>;
}

function formatMoney(value: string) {
    const amount = Number(value);

    if (Number.isNaN(amount)) {
        return value;
    }

    return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: 'PKR',
        maximumFractionDigits: 0,
    }).format(amount);
}

ProgramsIndex.layout = () => ({
    breadcrumbs: [
        {
            title: 'Programs',
            href: '/programs',
        },
    ],
});
