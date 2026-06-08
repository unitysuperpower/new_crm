<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreInquiryRequest;
use App\Http\Requests\UpdateInquiryRequest;
use App\Models\Campus;
use App\Models\Inquiry;
use App\Models\Program;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class InquiryController extends Controller
{
    private const STATUSES = [
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
        'master calsses',
    ];

    private const DEPARTMENTS = ['admission', 'academics', 'accouts'];

    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', Inquiry::class);

        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'scope' => ['nullable', Rule::in(['all', 'assigned_to_me'])],
            'status' => ['nullable', Rule::in(self::STATUSES)],
            'department' => ['nullable', Rule::in(self::DEPARTMENTS)],
            'assigned_user_id' => ['nullable', 'integer', 'exists:users,id'],
            'source' => ['nullable', 'string', 'max:255'],
            'campus_id' => [
                'nullable',
                'integer',
                Rule::exists('campuses', 'id')->where('is_active', true),
            ],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
        ]);

        $inquiries = Inquiry::query()
            ->with(['program:id,name', 'campusModel:id,name', 'assignedUser:id,name', 'streams.user:id,name'])
            ->where(function ($query) {
                $query->whereNull('campus_id')
                    ->orWhereHas('campusModel', fn ($campusQuery) => $campusQuery->where('is_active', true));
            })
            ->when(
                ($filters['scope'] ?? 'all') === 'assigned_to_me',
                fn ($query) => $query->where('assigned_user_id', $request->user()->id),
            )
            ->when($filters['search'] ?? null, function ($query, string $search) {
                $query->where(function ($inner) use ($search) {
                    $inner->where('name', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('city', 'like', "%{$search}%")
                        ->orWhere('source', 'like', "%{$search}%")
                        ->orWhere('previous_program', 'like', "%{$search}%")
                        ->orWhere('campus', 'like', "%{$search}%")
                        ->orWhereHas('campusModel', fn ($campusQuery) => $campusQuery->where('name', 'like', "%{$search}%"));
                });
            })
            ->when($filters['status'] ?? null, fn ($query, string $status) => $query->where('status', $status))
            ->when($filters['department'] ?? null, fn ($query, string $department) => $query->where('department', $department))
            ->when($filters['assigned_user_id'] ?? null, fn ($query, int $userId) => $query->where('assigned_user_id', $userId))
            ->when($filters['source'] ?? null, fn ($query, string $source) => $query->where('source', $source))
            ->when($filters['campus_id'] ?? null, fn ($query, int $campusId) => $query->where('campus_id', $campusId))
            ->when($filters['date_from'] ?? null, fn ($query, string $dateFrom) => $query->whereDate('created_at', '>=', $dateFrom))
            ->when($filters['date_to'] ?? null, fn ($query, string $dateTo) => $query->whereDate('created_at', '<=', $dateTo))
            ->latest()
            ->get()
            ->map(fn (Inquiry $inquiry) => $this->serializeInquiry($inquiry, $request->user()));

        return Inertia::render('dashboard', [
            'pageTitle' => $request->routeIs('inquiries.index') ? 'Inquiries' : 'Dashboard',
            'pageUrl' => $request->routeIs('inquiries.index') ? '/inquiries' : '/dashboard',
            'filters' => [
                'search' => $filters['search'] ?? '',
                'scope' => $filters['scope'] ?? 'all',
                'status' => $filters['status'] ?? '',
                'department' => $filters['department'] ?? '',
                'assigned_user_id' => $filters['assigned_user_id'] ?? '',
                'source' => $filters['source'] ?? '',
                'campus_id' => $filters['campus_id'] ?? '',
                'date_from' => $filters['date_from'] ?? '',
                'date_to' => $filters['date_to'] ?? '',
            ],
            'inquiries' => $inquiries,
            'programs' => Program::query()->orderBy('name')->get(['id', 'name']),
            'campuses' => Campus::query()
                ->orderBy('name')
                ->get(['id', 'name', 'is_active']),
            'teamMembers' => User::query()->orderBy('name')->get(['id', 'name']),
            'sourceOptions' => Inquiry::query()
                ->where(function ($query) {
                    $query->whereNull('campus_id')
                        ->orWhereHas('campusModel', fn ($campusQuery) => $campusQuery->where('is_active', true));
                })
                ->whereNotNull('source')
                ->distinct()
                ->orderBy('source')
                ->pluck('source')
                ->values(),
            'statusOptions' => self::STATUSES,
            'departmentOptions' => self::DEPARTMENTS,
            'crmPermissions' => [
                'canCreateInquiry' => $request->user()->can('create', Inquiry::class),
                'canImportInquiry' => $request->user()->can('import', Inquiry::class),
                'canAssignInquiry' => $request->user()->can('assign', Inquiry::class),
                'canManageCampus' => $request->user()->can('update', new Campus),
            ],
        ]);
    }

    public function store(StoreInquiryRequest $request): RedirectResponse
    {
        Gate::authorize('create', Inquiry::class);

        Inquiry::create($request->validated());

        return back()->with('success', 'Inquiry created.');
    }

    public function import(Request $request): RedirectResponse
    {
        Gate::authorize('import', Inquiry::class);

        $validated = $request->validate([
            'rows' => ['required', 'array', 'min:1', 'max:500'],
            'rows.*.name' => ['required', 'string', 'max:255'],
            'rows.*.phone' => ['required', 'string', 'max:50'],
            'rows.*.email' => ['nullable', 'email', 'max:255'],
            'rows.*.city' => ['nullable', 'string', 'max:255'],
            'rows.*.address' => ['nullable', 'string', 'max:2000'],
            'rows.*.source' => ['nullable', 'string', 'max:255'],
            'rows.*.program_id' => ['nullable', 'exists:programs,id'],
            'rows.*.previous_program' => ['nullable', 'string', 'max:255'],
            'rows.*.campus' => ['nullable', 'string', 'max:255'],
            'rows.*.campus_id' => [
                'nullable',
                Rule::exists('campuses', 'id')->where('is_active', true),
            ],
            'rows.*.status' => ['required', Rule::in(self::STATUSES)],
            'rows.*.assigned_user_id' => ['nullable', 'exists:users,id'],
            'rows.*.department' => ['required', Rule::in(self::DEPARTMENTS)],
            'rows.*.next_follow_up_at' => ['nullable', 'date'],
            'rows.*.message' => ['nullable', 'string', 'max:5000'],
        ]);

        DB::transaction(function () use ($validated) {
            foreach ($validated['rows'] as $row) {
                if (empty($row['campus_id']) && ! empty($row['campus'])) {
                    $row['campus_id'] = Campus::query()->firstOrCreate([
                        'name' => $row['campus'],
                    ])->id;
                }

                Inquiry::create($row);
            }
        });

        return back()->with('success', count($validated['rows']).' inquiries imported.');
    }

    public function assign(Request $request): RedirectResponse
    {
        Gate::authorize('assign', Inquiry::class);

        $validated = $request->validate([
            'inquiry_ids' => ['required', 'array', 'min:1'],
            'inquiry_ids.*' => ['integer', 'exists:inquiries,id'],
            'assigned_user_id' => ['required', 'integer', 'exists:users,id'],
        ]);

        Inquiry::query()
            ->whereIn('id', $validated['inquiry_ids'])
            ->update(['assigned_user_id' => $validated['assigned_user_id']]);

        return back()->with('success', count($validated['inquiry_ids']).' inquiries assigned.');
    }

    public function update(UpdateInquiryRequest $request, Inquiry $inquiry): RedirectResponse
    {
        $inquiry->update($request->validated());

        return back()->with('success', 'Inquiry updated.');
    }

    private function serializeInquiry(Inquiry $inquiry, User $user): array
    {
        return [
            'id' => $inquiry->id,
            'name' => $inquiry->name,
            'phone' => $inquiry->phone,
            'email' => $inquiry->email,
            'city' => $inquiry->city,
            'address' => $inquiry->address,
            'source' => $inquiry->source,
            'program_id' => $inquiry->program_id,
            'program' => $inquiry->program?->only(['id', 'name']),
            'previous_program' => $inquiry->previous_program,
            'campus_id' => $inquiry->campus_id,
            'campus_model' => $inquiry->campusModel?->only(['id', 'name']),
            'campus' => $inquiry->campus,
            'status' => $inquiry->status,
            'assigned_user_id' => $inquiry->assigned_user_id,
            'assigned_user' => $inquiry->assignedUser?->only(['id', 'name']),
            'department' => $inquiry->department,
            'next_follow_up_at' => $inquiry->next_follow_up_at?->format('Y-m-d'),
            'message' => $inquiry->message,
            'can_update' => $user->can('update', $inquiry),
            'created_at' => $inquiry->created_at?->format('M d, Y h:i A'),
            'streams' => $inquiry->streams->map(fn ($stream) => [
                'id' => $stream->id,
                'response' => $stream->response,
                'user' => $stream->user?->only(['id', 'name']),
                'created_at' => $stream->created_at?->format('M d, Y h:i A'),
            ])->values(),
        ];
    }
}
