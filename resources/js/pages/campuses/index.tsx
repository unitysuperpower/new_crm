import { FormEvent, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Building2, Edit3, MapPin, Power, PowerOff, Plus, Search, Trash2 } from 'lucide-react';

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

type Campus = {
    id: number;
    name: string;
    city: string | null;
    address: string | null;
    is_active: boolean;
    inquiries_count: number;
    created_at: string | null;
    can_delete: boolean;
};

type CampusForm = {
    name: string;
    city: string;
    address: string;
};

const emptyCampus: CampusForm = {
    name: '',
    city: '',
    address: '',
};

export default function CampusesIndex({
    filters,
    campuses,
    metrics,
}: {
    filters: { search: string };
    campuses: Campus[];
    metrics: {
        total: number;
        active: number;
        inactive: number;
        withInquiries: number;
        unused: number;
    };
}) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingCampus, setEditingCampus] = useState<Campus | null>(null);
    const [form, setForm] = useState<CampusForm>(emptyCampus);
    const [togglingCampusIds, setTogglingCampusIds] = useState<number[]>([]);

    const submitSearch = (event: FormEvent) => {
        event.preventDefault();
        router.get('/campuses', search ? { search } : {}, {
            preserveState: true,
            replace: true,
        });
    };

    const openCreate = () => {
        setEditingCampus(null);
        setForm(emptyCampus);
        setModalOpen(true);
    };

    const openEdit = (campus: Campus) => {
        setEditingCampus(campus);
        setForm({
            name: campus.name,
            city: campus.city ?? '',
            address: campus.address ?? '',
        });
        setModalOpen(true);
    };

    const submitCampus = (event: FormEvent) => {
        event.preventDefault();
        const payload = {
            name: form.name,
            city: form.city || null,
            address: form.address || null,
        };

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                setModalOpen(false);
                setEditingCampus(null);
                setForm(emptyCampus);
            },
        };

        if (editingCampus) {
            router.patch(`/campuses/${editingCampus.id}`, payload, options);
            return;
        }

        router.post('/campuses', payload, options);
    };

    const deleteCampus = (campus: Campus) => {
        if (!campus.can_delete) return;

        router.delete(`/campuses/${campus.id}`, {
            preserveScroll: true,
        });
    };

    const toggleCampus = (campus: Campus) => {
        setTogglingCampusIds((current) => [...new Set([...current, campus.id])]);
        router.patch(
            `/campuses/${campus.id}/toggle`,
            { is_active: !campus.is_active },
            {
                preserveScroll: true,
                onFinish: () => {
                    setTogglingCampusIds((current) => current.filter((id) => id !== campus.id));
                },
            },
        );
    };

    return (
        <>
            <Head title="Campuses" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-xl font-semibold">Campuses</h1>
                        <p className="text-muted-foreground text-sm">
                            Manage campus options used by inquiries and CSV imports.
                        </p>
                    </div>
                    <Button type="button" onClick={openCreate}>
                        <Plus />
                        Add campus
                    </Button>
                </div>

                <div className="grid gap-3 md:grid-cols-4">
                    <Metric label="Total campuses" value={metrics.total} />
                    <Metric label="Visible" value={metrics.active} />
                    <Metric label="Hidden" value={metrics.inactive} />
                    <Metric label="Used by inquiries" value={metrics.withInquiries} />
                </div>

                <div className="rounded-lg border bg-background">
                    <div className="flex flex-col gap-3 border-b p-4 md:flex-row md:items-center md:justify-between">
                        <form className="relative w-full md:max-w-md" onSubmit={submitSearch}>
                            <Search className="text-muted-foreground absolute top-2.5 left-3 size-4" />
                            <Input
                                className="pl-9"
                                value={search}
                                placeholder="Search campuses, city, or address"
                                onChange={(event) => setSearch(event.target.value)}
                            />
                        </form>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[760px] text-sm">
                            <thead className="bg-muted/60 text-muted-foreground">
                                <tr>
                                    <Th>Campus</Th>
                                    <Th>City</Th>
                                    <Th>Address</Th>
                                    <Th>Visibility</Th>
                                    <Th>Inquiries</Th>
                                    <Th>Created</Th>
                                    <Th></Th>
                                </tr>
                            </thead>
                            <tbody>
                                {campuses.map((campus) => (
                                    <tr key={campus.id} className="border-t">
                                        <Td>
                                            <div className="flex items-center gap-2 font-medium">
                                                <Building2 className="text-muted-foreground size-4" />
                                                {campus.name}
                                            </div>
                                        </Td>
                                        <Td>{campus.city || 'Not set'}</Td>
                                        <Td>
                                            <div className="flex max-w-md items-start gap-2">
                                                <MapPin className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                                                <span>{campus.address || 'No address'}</span>
                                            </div>
                                        </Td>
                                        <Td>
                                            <Badge variant={campus.is_active ? 'secondary' : 'outline'}>
                                                {campus.is_active ? 'Visible' : 'Hidden'}
                                            </Badge>
                                        </Td>
                                        <Td>
                                            <Badge variant={campus.inquiries_count > 0 ? 'secondary' : 'outline'}>
                                                {campus.inquiries_count}
                                            </Badge>
                                        </Td>
                                        <Td>{campus.created_at ?? 'Not available'}</Td>
                                        <Td>
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    type="button"
                                                    variant={campus.is_active ? 'outline' : 'secondary'}
                                                    size="sm"
                                                    disabled={togglingCampusIds.includes(campus.id)}
                                                    onClick={() => toggleCampus(campus)}
                                                >
                                                    {campus.is_active ? <PowerOff /> : <Power />}
                                                    {campus.is_active ? 'Hide' : 'Show'}
                                                </Button>
                                                <Button type="button" variant="ghost" size="sm" onClick={() => openEdit(campus)}>
                                                    <Edit3 />
                                                    Edit
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    disabled={!campus.can_delete}
                                                    onClick={() => deleteCampus(campus)}
                                                >
                                                    <Trash2 />
                                                    Delete
                                                </Button>
                                            </div>
                                        </Td>
                                    </tr>
                                ))}
                                {campuses.length === 0 && (
                                    <tr>
                                        <td className="text-muted-foreground p-8 text-center" colSpan={7}>
                                            No campuses found.
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
                        <DialogTitle>{editingCampus ? 'Edit campus' : 'Add campus'}</DialogTitle>
                        <DialogDescription>
                            Campus names appear in inquiry forms and CSV imports.
                        </DialogDescription>
                    </DialogHeader>
                    <form className="space-y-4" onSubmit={submitCampus}>
                        <Field
                            label="Campus name"
                            value={form.name}
                            required
                            onChange={(name) => setForm({ ...form, name })}
                        />
                        <Field
                            label="City"
                            value={form.city}
                            placeholder="Example: Lahore"
                            onChange={(city) => setForm({ ...form, city })}
                        />
                        <div className="grid gap-2">
                            <Label>Address</Label>
                            <textarea
                                className="border-input focus-visible:border-ring focus-visible:ring-ring/50 min-h-24 rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-[3px]"
                                value={form.address}
                                onChange={(event) => setForm({ ...form, address: event.target.value })}
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit">{editingCampus ? 'Save changes' : 'Create campus'}</Button>
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
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    type?: string;
    required?: boolean;
    placeholder?: string;
}) {
    return (
        <div className="grid gap-2">
            <Label>{label}</Label>
            <Input
                type={type}
                value={value}
                required={required}
                placeholder={placeholder}
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

CampusesIndex.layout = () => ({
    breadcrumbs: [
        {
            title: 'Campuses',
            href: '/campuses',
        },
    ],
});
