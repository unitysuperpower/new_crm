import { FormEvent, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Edit3, GraduationCap, Plus, Search, Trash2 } from 'lucide-react';

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
        if (!program.can_delete) return;

        router.delete(`/programs/${program.id}`, {
            preserveScroll: true,
        });
    };

    return (
        <>
            <Head title="Programs" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-xl font-semibold">Programs</h1>
                        <p className="text-muted-foreground text-sm">
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
                    <Metric label="Used by inquiries" value={metrics.withInquiries} />
                    <Metric label="Unused" value={metrics.unused} />
                </div>

                <div className="rounded-lg border bg-background">
                    <div className="flex flex-col gap-3 border-b p-4 md:flex-row md:items-center md:justify-between">
                        <form className="relative w-full md:max-w-md" onSubmit={submitSearch}>
                            <Search className="text-muted-foreground absolute top-2.5 left-3 size-4" />
                            <Input
                                className="pl-9"
                                value={search}
                                placeholder="Search programs or duration"
                                onChange={(event) => setSearch(event.target.value)}
                            />
                        </form>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[760px] text-sm">
                            <thead className="bg-muted/60 text-muted-foreground">
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
                                    <tr key={program.id} className="border-t">
                                        <Td>
                                            <div className="flex items-center gap-2 font-medium">
                                                <GraduationCap className="text-muted-foreground size-4" />
                                                {program.name}
                                            </div>
                                        </Td>
                                        <Td>{program.duration || 'Not set'}</Td>
                                        <Td>{formatMoney(program.fee)}</Td>
                                        <Td>
                                            <Badge variant={program.inquiries_count > 0 ? 'secondary' : 'outline'}>
                                                {program.inquiries_count}
                                            </Badge>
                                        </Td>
                                        <Td>{program.created_at ?? 'Not available'}</Td>
                                        <Td>
                                            <div className="flex justify-end gap-2">
                                                <Button type="button" variant="ghost" size="sm" onClick={() => openEdit(program)}>
                                                    <Edit3 />
                                                    Edit
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    disabled={!program.can_delete}
                                                    onClick={() => deleteProgram(program)}
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
                                        <td className="text-muted-foreground p-8 text-center" colSpan={6}>
                                            No programs found.
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
                        <DialogTitle>{editingProgram ? 'Edit program' : 'Add program'}</DialogTitle>
                        <DialogDescription>
                            Program names appear in inquiry forms and CSV imports.
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
                            onChange={(duration) => setForm({ ...form, duration })}
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
                            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit">{editingProgram ? 'Save changes' : 'Create program'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
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
    return <th className="px-4 py-3 text-left font-medium">{children}</th>;
}

function Td({ children }: { children: React.ReactNode }) {
    return <td className="px-4 py-3 align-top">{children}</td>;
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
