<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Http\Requests\SaveInquiryActivityRequest;
use App\Http\Requests\StoreInquiryRequest;
use App\Models\Campus;
use App\Models\Inquiry;
use App\Models\Program;
use App\Models\Stream;
use App\Models\User;
use App\Support\InquiryOptions;
use Dompdf\Dompdf;
use Dompdf\Options;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class InquiryController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', Inquiry::class);

        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', Rule::in(InquiryOptions::STATUSES)],
            'department' => ['nullable', Rule::in(InquiryOptions::DEPARTMENTS)],
            'assigned_user_id' => ['nullable', 'integer', 'exists:users,id'],
            'source' => ['nullable', 'string', 'max:255'],
            'campus_id' => [
                'nullable',
                'integer',
                Rule::exists('campuses', 'id')->where('is_active', true),
            ],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
            'queue' => ['nullable', Rule::in(['all', 'assigned_today', 'yesterday', 'today', 'next_3_days'])],
        ]);

        $isInquiryPage = $request->routeIs('inquiries.index');
        $queue = $filters['queue'] ?? 'all';

        $query = $this->workspaceQuery($request, $isInquiryPage, $queue)
            ->with(['program:id,name', 'campusModel:id,name', 'assignedUser:id,name', 'streams.user:id,name'])
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
            ->when(
                ! $isInquiryPage && ($filters['assigned_user_id'] ?? null),
                fn ($query) => $query->where('assigned_user_id', $filters['assigned_user_id']),
            )
            ->when($filters['source'] ?? null, fn ($query, string $source) => $query->where('source', $source))
            ->when($filters['campus_id'] ?? null, fn ($query, int $campusId) => $query->where('campus_id', $campusId))
            ->when($filters['date_from'] ?? null, fn ($query, string $dateFrom) => $query->whereDate('created_at', '>=', $dateFrom))
            ->when($filters['date_to'] ?? null, fn ($query, string $dateTo) => $query->whereDate('created_at', '<=', $dateTo));

        match (true) {
            $queue === 'assigned_today' => $query->latest('assigned_at'),
            $isInquiryPage => $query->orderBy('next_follow_up_at')->latest('updated_at'),
            default => $query->latest('created_at'),
        };

        $paginatedInquiries = $query->paginate(10)->withQueryString();
        $inquiries = $paginatedInquiries->getCollection()
            ->map(fn (Inquiry $inquiry) => $this->serializeInquiry($inquiry, $request->user()))
            ->values();

        return Inertia::render('dashboard', [
            'pageTitle' => $isInquiryPage ? 'Inquiries' : 'Dashboard',
            'pageUrl' => $isInquiryPage ? '/inquiries' : '/dashboard',
            'pageMode' => $isInquiryPage ? 'assigned' : 'all',
            'filters' => [
                'search' => $filters['search'] ?? '',
                'status' => $filters['status'] ?? '',
                'department' => $filters['department'] ?? '',
                'assigned_user_id' => $isInquiryPage ? '' : ($filters['assigned_user_id'] ?? ''),
                'source' => $filters['source'] ?? '',
                'campus_id' => $filters['campus_id'] ?? '',
                'date_from' => $filters['date_from'] ?? '',
                'date_to' => $filters['date_to'] ?? '',
                'queue' => $queue,
            ],
            'inquiries' => $inquiries,
            'pagination' => [
                'current_page' => $paginatedInquiries->currentPage(),
                'from' => $paginatedInquiries->firstItem(),
                'last_page' => $paginatedInquiries->lastPage(),
                'next_page_url' => $paginatedInquiries->nextPageUrl(),
                'per_page' => $paginatedInquiries->perPage(),
                'prev_page_url' => $paginatedInquiries->previousPageUrl(),
                'to' => $paginatedInquiries->lastItem(),
                'total' => $paginatedInquiries->total(),
            ],
            'programs' => Program::query()->orderBy('name')->get(['id', 'name']),
            'campuses' => Campus::query()
                ->orderBy('name')
                ->get(['id', 'name', 'is_active']),
            'teamMembers' => User::query()->orderBy('name')->get(['id', 'name', 'department']),
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
            'statusOptions' => InquiryOptions::STATUSES,
            'departmentOptions' => InquiryOptions::DEPARTMENTS,
            'inquiryCreationDefaults' => [
                'assigned_user_id' => (string) $request->user()->id,
                'department' => $request->user()->department ?? 'admission',
            ],
            'filterCounts' => $this->filterCounts($request, $isInquiryPage, $queue),
            'queueCounts' => $this->queueCounts($request, $isInquiryPage),
            'crmPermissions' => [
                'canCreateInquiry' => $request->user()->can('create', Inquiry::class),
                'canImportInquiry' => $request->user()->can('import', Inquiry::class),
                'canAssignInquiry' => $request->user()->can('assign', Inquiry::class),
                'canSelectInquiryAssignee' => $request->user()->role === UserRole::SuperAdmin,
                'canChangeInquiryDepartment' => $request->user()->role === UserRole::SuperAdmin,
                'canManageCampus' => $request->user()->can('update', new Campus),
            ],
        ]);
    }

    public function store(StoreInquiryRequest $request): RedirectResponse
    {
        Gate::authorize('create', Inquiry::class);

        $data = $request->validated();
        if ($request->user()->role !== UserRole::SuperAdmin) {
            $data['assigned_user_id'] = $request->user()->id;
            $data['department'] = $request->user()->department;
        }

        if (! empty($data['assigned_user_id'])) {
            $data['assigned_at'] = now();
        }

        Inquiry::create($data);

        return back()->with('success', 'Inquiry created.');
    }

    public function report(Request $request): JsonResponse
    {
        Gate::authorize('viewAny', Inquiry::class);

        $filters = $this->validateReportFilters($request);
        $inquiries = $this->reportQuery($request, $filters)->get();

        return response()->json($this->reportPayload($inquiries, $filters));
    }

    public function reportPdf(Request $request): HttpResponse
    {
        Gate::authorize('viewAny', Inquiry::class);

        $filters = $this->validateReportFilters($request);
        $inquiries = $this->reportQuery($request, $filters)->get();
        $payload = $this->reportPayload($inquiries, $filters);

        $options = new Options;
        $options->set('defaultFont', 'DejaVu Sans');

        $pdf = new Dompdf($options);
        $pdf->loadHtml(view('reports.inquiries', $payload)->render());
        $pdf->setPaper('a4', 'landscape');
        $pdf->render();

        $filename = 'assigned-inquiries-report-'.now()->format('Y-m-d-His').'.pdf';

        return response($pdf->output(), 200, [
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
            'Content-Type' => 'application/pdf',
        ]);
    }

    // The import method allows authorized users to bulk import multiple inquiries at once, significantly reducing the time and effort required to add large volumes of inquiries into the system, especially when migrating from another platform or onboarding a new batch of leads.
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
            'rows.*.status' => ['required', Rule::in(InquiryOptions::STATUSES)],
            'rows.*.assigned_user_id' => ['prohibited'],
            'rows.*.department' => ['required', Rule::in(InquiryOptions::DEPARTMENTS)],
            'rows.*.next_follow_up_at' => ['nullable', 'date'],
            'rows.*.message' => ['nullable', 'string', 'max:5000'],
        ]);

        DB::transaction(function () use ($validated) {
            foreach ($validated['rows'] as $row) {
                if (empty($row['campus_id']) && ! empty($row['campus'])) {
                    $row['campus_id'] = Campus::query()
                        ->where('is_active', true)
                        ->whereRaw('LOWER(name) = ?', [mb_strtolower($row['campus'])])
                        ->value('id');
                }

                Inquiry::create($row);
            }
        });

        return back()->with('success', count($validated['rows']).' inquiries imported.');
    }

    public function search(Request $request): JsonResponse
    {
        Gate::authorize('viewAny', Inquiry::class);

        $validated = $request->validate([
            'query' => ['required', 'string', 'min:2', 'max:100'],
            'mode' => ['nullable', Rule::in(['all', 'assigned'])],
        ]);

        $isAssigned = ($validated['mode'] ?? 'all') === 'assigned';
        $search = $validated['query'];

        $results = $this->visibleInquiryQuery($request, $isAssigned)
            ->with(['program:id,name', 'campusModel:id,name', 'assignedUser:id,name', 'streams.user:id,name'])
            ->where(function (Builder $query) use ($search): void {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            })
            ->latest()
            ->limit(8)
            ->get()
            ->map(fn (Inquiry $inquiry) => $this->serializeInquiry($inquiry, $request->user()))
            ->values();

        return response()->json(['results' => $results]);
    }

    // The assign method allows authorized users to bulk assign multiple inquiries to a specific team member, streamlining the workflow and ensuring that inquiries are promptly attended to by the appropriate staff.
    public function assign(Request $request): RedirectResponse
    {
        Gate::authorize('assign', Inquiry::class);

        $validated = $request->validate([
            'inquiry_ids' => ['required', 'array', 'min:1'],
            'inquiry_ids.*' => ['integer', 'exists:inquiries,id'],
            'assigned_user_id' => ['required', 'integer', 'exists:users,id'],
        ]);

        $assignee = User::findOrFail($validated['assigned_user_id']);

        Inquiry::query()
            ->whereIn('id', $validated['inquiry_ids'])
            ->update([
                'assigned_user_id' => $validated['assigned_user_id'],
                'department' => $assignee->department,
                'assigned_at' => now(),
                'last_activity_at' => null,
            ]);

        return back()->with('success', count($validated['inquiry_ids']).' inquiries assigned.');
    }

    public function saveActivity(SaveInquiryActivityRequest $request, Inquiry $inquiry): RedirectResponse
    {
        $validated = $request->validated();
        $canUpdate = $request->user()->can('update', $inquiry);
        $response = trim($validated['response'] ?? '');

        DB::transaction(function () use ($canUpdate, $inquiry, $request, $response, $validated): void {
            if ($canUpdate) {
                $updates = [
                    'name' => $validated['name'],
                    'phone' => $validated['phone'],
                    'email' => $validated['email'] ?? null,
                    'city' => $validated['city'] ?? null,
                    'address' => $validated['address'] ?? null,
                    'source' => $validated['source'] ?? null,
                    'program_id' => $validated['program_id'] ?? null,
                    'previous_program' => $validated['previous_program'] ?? null,
                    'campus_id' => $validated['campus_id'] ?? null,
                    'message' => $validated['message'] ?? null,
                    'status' => $validated['status'],
                    'department' => $validated['department'],
                    'next_follow_up_at' => $validated['next_follow_up_at'] ?? null,
                ];

                $inquiry->update($updates);
            }

            if ($response !== '') {
                Gate::authorize('createStream', $inquiry);

                Stream::create([
                    'response' => $response,
                    'user_id' => $request->user()->id,
                    'inquiry_id' => $inquiry->id,
                    'last_status' => $inquiry->status,
                ]);
            }


            if ($canUpdate || $response !== '') {
                $inquiry->update(['last_activity_at' => now()]);
            }
        });

        $message = $canUpdate
            ? 'Inquiry and discussion updated.'
            : 'Discussion added.';

        return back()->with('success', $message);
    }

    // The serializeInquiry method transforms an Inquiry model instance into a structured array format suitable for frontend consumption, including related data and permission flags, ensuring that the frontend receives all necessary information in a consistent and optimized manner for rendering inquiry details and associated actions.
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
            'assigned_at' => $inquiry->assigned_at?->format('M d, Y h:i A'),
            'last_activity_at' => $inquiry->last_activity_at?->format('M d, Y h:i A'),
            'message' => $inquiry->message,
            'can_update' => $user->can('update', $inquiry),
            'can_stream' => $user->can('createStream', $inquiry),
            'created_at' => $inquiry->created_at?->format('M d, Y h:i A'),
            'streams' => $inquiry->streams->map(fn ($stream) => [
                'id' => $stream->id,
                'response' => $stream->response,
                'user' => $stream->user?->only(['id', 'name']),
                'created_at' => $stream->created_at?->format('M d, Y h:i A'),
                'last_status' => $stream->last_status,
            ])->values(),
        ];
    }

    private function visibleInquiryQuery(Request $request, bool $assignedOnly): Builder
    {
        return Inquiry::query()
            ->where(function (Builder $query): void {
                $query->whereNull('campus_id')
                    ->orWhereHas('campusModel', fn (Builder $campusQuery) => $campusQuery->where('is_active', true));
            })
            ->when(
                $assignedOnly,
                fn (Builder $query) => $query->where('assigned_user_id', $request->user()->id),
            );
    }


    private function workspaceQuery(Request $request, bool $isInquiryPage, string $queue): Builder
    {
        return $this->visibleInquiryQuery($request, $isInquiryPage)
            ->when(
                $queue === 'assigned_today',
                fn (Builder $query) => $query
                    ->whereNotNull('assigned_user_id')
                    ->whereDate('assigned_at', today()),
            )
            ->when(
                $isInquiryPage && $queue !== 'assigned_today',
                fn (Builder $query) => $query->when(
                    $queue !== 'all',
                    function (Builder $followUpQuery) use ($queue): void {
                        $followUpQuery->whereNotNull('next_follow_up_at');

                        match ($queue) {
                            'yesterday' => $followUpQuery->whereDate('next_follow_up_at', today()->subDay()),
                            'today' => $followUpQuery->whereDate('next_follow_up_at', today()),
                            'next_3_days' => $followUpQuery->whereBetween('next_follow_up_at', [
                                today()->addDay()->startOfDay(),
                                today()->addDays(3)->endOfDay(),
                            ]),
                            default => null,
                        };
                    },
                ),
            );
    }

    private function filterCounts(Request $request, bool $assignedOnly, string $queue): array
    {
        $base = $this->workspaceQuery($request, $assignedOnly, $queue);

        $grouped = static function (Builder $query, string $column): array {
            return $query
                ->whereNotNull($column)
                ->selectRaw("{$column} as filter_value, COUNT(*) as aggregate")
                ->groupBy($column)
                ->pluck('aggregate', 'filter_value')
                ->map(fn ($count) => (int) $count)
                ->all();
        };

        return [
            'status' => $grouped(clone $base, 'status'),
            'department' => $grouped(clone $base, 'department'),
            'source' => $grouped(clone $base, 'source'),
            'campus' => $grouped(clone $base, 'campus_id'),
            'assigned_user' => $assignedOnly
                ? []
                : $grouped(clone $base, 'assigned_user_id'),
        ];
    }

    private function queueCounts(Request $request, bool $isInquiryPage): array
    {
        $workspaceScope = $this->visibleInquiryQuery($request, $isInquiryPage);
        $followUpScope = $this->visibleInquiryQuery($request, $isInquiryPage)
            ->whereNotNull('next_follow_up_at');

        return [
            'total_inquiries' => (clone $workspaceScope)->count(),
            'assigned_today' => (clone $workspaceScope)
                ->whereNotNull('assigned_user_id')
                ->whereDate('assigned_at', today())
                ->count(),
            'follow_ups_yesterday' => (clone $followUpScope)
                ->whereDate('next_follow_up_at', today()->subDay())
                ->count(),
            'follow_ups_today' => (clone $followUpScope)
                ->whereDate('next_follow_up_at', today())
                ->count(),
            'follow_ups_next_3_days' => (clone $followUpScope)
                ->whereBetween('next_follow_up_at', [
                    today()->addDay()->startOfDay(),
                    today()->addDays(3)->endOfDay(),
                ])
                ->count(),
        ];
    }

    private function validateReportFilters(Request $request): array
    {
        return $request->validate([
            'campus_id' => ['nullable', 'integer', 'exists:campuses,id'],
            'status' => ['nullable', Rule::in(InquiryOptions::STATUSES)],
            'assigned_user_id' => ['nullable', 'integer', 'exists:users,id'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
        ]);
    }

    private function reportQuery(Request $request, array $filters): Builder
    {
        $canSelectUser = $request->user()->can('assign', Inquiry::class);

        return Inquiry::query()
            ->with(['program:id,name', 'campusModel:id,name', 'assignedUser:id,name'])
            ->whereNotNull('assigned_user_id')
            ->where(function (Builder $query) {
                $query->whereNull('campus_id')
                    ->orWhereHas('campusModel', fn (Builder $campusQuery) => $campusQuery->where('is_active', true));
            })
            ->when(
                $canSelectUser,
                fn (Builder $query) => $query->when(
                    $filters['assigned_user_id'] ?? null,
                    fn (Builder $inner, int $userId) => $inner->where('assigned_user_id', $userId),
                ),
                fn (Builder $query) => $query->where('assigned_user_id', $request->user()->id),
            )
            ->when($filters['campus_id'] ?? null, fn (Builder $query, int $campusId) => $query->where('campus_id', $campusId))
            ->when($filters['status'] ?? null, fn (Builder $query, string $status) => $query->where('status', $status))
            ->when($filters['date_from'] ?? null, fn (Builder $query, string $date) => $query->whereDate('updated_at', '>=', $date))
            ->when($filters['date_to'] ?? null, fn (Builder $query, string $date) => $query->whereDate('updated_at', '<=', $date))
            ->latest('updated_at');
    }

    private function reportPayload($inquiries, array $filters): array
    {
        return [
            'generatedAt' => now()->format('M d, Y h:i A'),
            'filters' => [
                'campus' => isset($filters['campus_id']) ? Campus::find($filters['campus_id'])?->name : null,
                'status' => $filters['status'] ?? null,
                'user' => isset($filters['assigned_user_id']) ? User::find($filters['assigned_user_id'])?->name : null,
                'dateFrom' => $filters['date_from'] ?? null,
                'dateTo' => $filters['date_to'] ?? null,
            ],
            'statusCounts' => $inquiries
                ->countBy('status')
                ->filter(fn (int $count) => $count > 0)
                ->sortDesc()
                ->all(),
            'total' => $inquiries->count(),
            'inquiries' => $inquiries->map(fn (Inquiry $inquiry) => [
                'id' => $inquiry->id,
                'name' => $inquiry->name,
                'phone' => $inquiry->phone,
                'email' => $inquiry->email,
                'program' => $inquiry->program?->name,
                'campus' => $inquiry->campusModel?->name ?? $inquiry->campus,
                'assigned_user' => $inquiry->assignedUser?->name,
                'status' => $inquiry->status,
                'department' => $inquiry->department,
                'updated_at' => $inquiry->updated_at?->format('M d, Y h:i A'),
            ])->values(),
        ];
    }
}
