<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreInquiryRequest;
use App\Http\Requests\UpdateInquiryRequest;
use App\Models\Campus;
use App\Models\Inquiry;
use App\Models\Program;
use App\Models\User;
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

        $isInquiryPage = $request->routeIs('inquiries.index');

        $query = Inquiry::query()
            ->with(['program:id,name', 'campusModel:id,name', 'assignedUser:id,name', 'streams.user:id,name'])
            ->where(function ($query) {
                $query->whereNull('campus_id')
                    ->orWhereHas('campusModel', fn ($campusQuery) => $campusQuery->where('is_active', true));
            })
            ->when(
                $isInquiryPage,
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
            ->when(
                ! $isInquiryPage && ($filters['assigned_user_id'] ?? null),
                fn ($query) => $query->where('assigned_user_id', $filters['assigned_user_id']),
            )
            ->when($filters['source'] ?? null, fn ($query, string $source) => $query->where('source', $source))
            ->when($filters['campus_id'] ?? null, fn ($query, int $campusId) => $query->where('campus_id', $campusId))
            ->when($filters['date_from'] ?? null, fn ($query, string $dateFrom) => $query->whereDate('created_at', '>=', $dateFrom))
            ->when($filters['date_to'] ?? null, fn ($query, string $dateTo) => $query->whereDate('created_at', '<=', $dateTo))
            ->latest();

        $paginatedInquiries = $query->paginate(15)->withQueryString();
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

    // The assign method allows authorized users to bulk assign multiple inquiries to a specific team member, streamlining the workflow and ensuring that inquiries are promptly attended to by the appropriate staff.
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

    // The update method allows authorized users to modify the details of an existing inquiry, ensuring that the information remains accurate and up-to-date as the inquiry progresses through different stages of engagement.
    public function update(UpdateInquiryRequest $request, Inquiry $inquiry): RedirectResponse
    {
        $inquiry->update($request->validated());

        return back()->with('success', 'Inquiry updated.');
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

    private function validateReportFilters(Request $request): array
    {
        return $request->validate([
            'campus_id' => ['nullable', 'integer', 'exists:campuses,id'],
            'status' => ['nullable', Rule::in(self::STATUSES)],
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
