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
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class InquiryController extends Controller
{
    // The index method retrieves and displays a paginated list of inquiries based on various filters and user permissions, providing an overview of the inquiries in the system and allowing users to easily navigate and manage them through the dashboard interface.
    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', Inquiry::class);
        $user = $request->user();

        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'array'],
            'status.*' => [Rule::in(InquiryOptions::STATUSES)],
            'department' => ['nullable', 'array'],
            'department.*' => [Rule::in(InquiryOptions::DEPARTMENTS)],
            'assigned_user_id' => ['nullable', 'array'],
            'assigned_user_id.*' => ['integer', 'exists:users,id'],
            'source' => ['nullable', 'array'],
            'source.*' => ['string', 'max:255'],
            'program_id' => ['nullable', 'array'],
            'program_id.*' => ['integer', 'exists:programs,id'],
            'campus_id' => ['nullable', 'array'],
            'campus_id.*' => [
                'integer',
                Rule::exists('campuses', 'id')->where('is_active', true),
            ],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
            'queue' => ['nullable', Rule::in(['all', 'assigned_today', 'yesterday', 'today', 'next_3_days'])],
            'per_page' => ['nullable', 'integer', Rule::in([10, 25, 50, 100])],
        ]);

        $isInquiryPage = $request->routeIs('inquiries.index');
        $queue = $filters['queue'] ?? 'all';

        $query = $this->workspaceQuery($request, $isInquiryPage, $queue)
            ->with(['program:id,name,campus_id,duration', 'campusModel:id,name', 'assignedUser:id,name', 'streams.user:id,name'])
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
            ->when($filters['status'] ?? null, fn ($query, array $statuses) => $query->whereIn('status', $statuses))
            ->when($filters['department'] ?? null, fn ($query, array $departments) => $query->whereIn('department', $departments))
            ->when(
                ! $isInquiryPage && ($filters['assigned_user_id'] ?? null),
                fn ($query) => $query->whereIn('assigned_user_id', $filters['assigned_user_id']),
            )
            ->when($filters['source'] ?? null, fn ($query, array $sources) => $query->whereIn('source', $sources))
            ->when($filters['program_id'] ?? null, fn ($query, array $programIds) => $query->whereIn('program_id', $programIds))
            ->when($filters['campus_id'] ?? null, fn ($query, array $campusIds) => $query->whereIn('campus_id', $campusIds))
            ->when($filters['date_from'] ?? null, fn ($query, string $dateFrom) => $query->whereDate('created_at', '>=', $dateFrom))
            ->when($filters['date_to'] ?? null, fn ($query, string $dateTo) => $query->whereDate('created_at', '<=', $dateTo));

        match (true) {
            $queue === 'assigned_today' => $query->latest('assigned_at'),
            $isInquiryPage => $query->orderBy('next_follow_up_at')->latest('updated_at'),
            default => $query->latest('created_at'),
        };

        $perPage = (int) ($filters['per_page'] ?? 10);
        $paginatedInquiries = $query->paginate($perPage)->withQueryString();
        $inquiries = $paginatedInquiries->getCollection()
            ->map(fn (Inquiry $inquiry) => $this->serializeInquiry($inquiry, $request->user()))
            ->values();

        return Inertia::render('dashboard', [
            'pageTitle' => $isInquiryPage ? 'Inquiries' : 'Dashboard',
            'pageUrl' => $isInquiryPage ? '/inquiries' : '/dashboard',
            'pageMode' => $isInquiryPage ? 'assigned' : 'all',
            'filters' => [
                'search' => $filters['search'] ?? '',
                'status' => $filters['status'] ?? [],
                'department' => $filters['department'] ?? [],
                'assigned_user_id' => $isInquiryPage ? [] : ($filters['assigned_user_id'] ?? []),
                'source' => $filters['source'] ?? [],
                'program_id' => $filters['program_id'] ?? [],
                'campus_id' => $filters['campus_id'] ?? [],
                'date_from' => $filters['date_from'] ?? '',
                'date_to' => $filters['date_to'] ?? '',
                'queue' => $queue,
                'per_page' => (string) $perPage,
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
            'programs' => Program::query()
                ->with('campus:id,name')
                ->when(
                    $user->role !== UserRole::SuperAdmin,
                    fn (Builder $query) => $query->whereIn('campus_id', $user->campuses()->select('campuses.id')),
                )
                ->orderBy('name')
                ->get(['id', 'campus_id', 'name', 'duration'])
                ->map(fn (Program $program) => [
                    'id' => $program->id,
                    'campus_id' => $program->campus_id,
                    'name' => $program->name,
                    'duration' => $program->duration,
                    'campus' => $program->campus?->only(['id', 'name']),
                ]),
            'campuses' => $this->accessibleCampusQuery($user)
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name', 'is_active']),
            'teamMembers' => User::query()->orderBy('name')->get(['id', 'name', 'department']),
            'sourceOptions' => $this->visibleInquiryQuery($request, false)
                ->whereNotNull('source')
                ->distinct()
                ->orderBy('source')
                ->pluck('source')
                ->values(),
            'statusOptions' => InquiryOptions::STATUSES,
            'departmentOptions' => InquiryOptions::DEPARTMENTS,
            'postalCommunicationOptions' => InquiryOptions::POSTAL_COMMUNICATIONS,
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
                'canViewDashboardMetrics' => in_array($request->user()->role, [UserRole::SuperAdmin, UserRole::Admin], true),
            ],
        ]);
    }

    // The store method handles the creation of a new inquiry, validating the incoming request data, assigning the inquiry to the appropriate user and department based on the creator's role, and saving it to the database, ensuring that new inquiries are properly recorded and assigned for follow-up.

    public function store(StoreInquiryRequest $request): RedirectResponse
    {
        Gate::authorize('create', Inquiry::class);

        $data = $request->validated();
        abort_unless($request->user()->canAccessCampus($data['campus_id'] ?? null), 403);
        if ($request->user()->role !== UserRole::SuperAdmin) {
            $data['assigned_user_id'] = $request->user()->id;
            $data['department'] = $request->user()->department;
        }

        $assignee = User::findOrFail($data['assigned_user_id']);

        if (! $assignee->canAccessCampus($data['campus_id'] ?? null)) {
            return back()->withErrors([
                'assigned_user_id' => 'Give the selected employee access to this campus before assigning the inquiry.',
            ]);
        }

        if (! empty($data['assigned_user_id'])) {
            $data['assigned_at'] = now();
        }

        Inquiry::create($data);

        return back()->with('success', 'Inquiry created.');
    }

    // The report method generates a JSON response containing a filtered list of inquiries along with aggregated counts based on the provided filters, allowing users to analyze and export inquiry data for reporting purposes.
    public function report(Request $request): JsonResponse
    {
        Gate::authorize('viewAny', Inquiry::class);

        $filters = $this->validateReportFilters($request);
        $inquiries = $this->reportQuery($request, $filters)->get();

        return response()->json($this->reportPayload($inquiries, $filters));
    }

    // The reportPdf method generates a PDF report containing a filtered list of inquiries along with aggregated counts based on the provided filters, allowing users to download and print inquiry data for reporting purposes.
    public function reportPdf(Request $request): HttpResponse
    {
        Gate::authorize('viewAny', Inquiry::class);

        $filters = $this->validateReportFilters($request);
        $inquiries = $this->reportQuery($request, $filters)->get();
        $payload = $this->reportPayload($inquiries, $filters);
        $logoPath = public_path('logo.jpeg');
        $payload['logoData'] = file_exists($logoPath)
            ? 'data:image/jpeg;base64,'.base64_encode(file_get_contents($logoPath))
            : null;

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

    // The invitationLetter method generates a PDF invitation letter for a specific inquiry, ensuring that only authorized users can access it and that the inquiry has been marked for postal communication, providing a professional and personalized invitation for the prospective student.

    public function invitationLetter(Request $request, Inquiry $inquiry): HttpResponse
    {
        Gate::authorize('view', $inquiry);
        abort_unless(in_array($inquiry->postal_communication, ['created', 'sent'], true), 404);

        $inquiry->loadMissing(['program:id,name,campus_id,duration', 'campusModel:id,name']);
        $logoPath = public_path('logo.jpeg');
        $logoData = file_exists($logoPath)
            ? 'data:image/jpeg;base64,'.base64_encode(file_get_contents($logoPath))
            : null;

        $options = new Options;
        $options->set('defaultFont', 'DejaVu Sans');

        $pdf = new Dompdf($options);
        $pdf->loadHtml(view('letters.inquiry-invitation', [
            'inquiry' => $inquiry,
            'logoData' => $logoData,
            'programName' => $inquiry->program?->name ?? 'the selected academic program',
            'campusName' => $inquiry->campusModel?->name ?? $inquiry->campus ?? 'Aurea Education',
        ])->render());
        $pdf->setPaper('a4', 'portrait');
        $pdf->render();

        $safeName = preg_replace('/[^A-Za-z0-9_-]+/', '-', $inquiry->name) ?: 'student';

        return response($pdf->output(), 200, [
            'Content-Disposition' => 'attachment; filename="student-inquiry-'.$safeName.'.pdf"',
            'Content-Type' => 'application/pdf',
        ]);
    }

    // The import method allows authorized users to bulk import multiple inquiries at once, significantly reducing the time and effort required to add large volumes of inquiries into the system, especially when migrating from another platform or onboarding a new batch of leads.
    public function import(Request $request): RedirectResponse
    {
        Gate::authorize('import', Inquiry::class);

        $validated = $request->validate([
            'csv_file' => ['nullable', 'file', 'mimes:csv,txt', 'max:5120'],
            'rows' => ['required', 'array', 'min:1', 'max:500'],
            'rows.*.name' => ['required', 'string', 'max:255'],
            'rows.*.phone' => ['required', 'string', 'max:50'],
            'rows.*.email' => ['nullable', 'email', 'max:255'],
            'rows.*.city' => ['nullable', 'string', 'max:255'],
            'rows.*.address' => ['nullable', 'string', 'max:2000'],
            'rows.*.source' => ['nullable', 'string', 'max:255'],
            'rows.*.program_id' => ['nullable', 'exists:programs,id'],
            'rows.*.program' => ['nullable', 'string', 'max:255'],
            'rows.*.program_name' => ['nullable', 'string', 'max:255'],
            'rows.*.program_duration' => ['nullable', 'string', 'max:255'],
            'rows.*.duration' => ['nullable', 'string', 'max:255'],
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

        $existingPhones = Inquiry::query()
            ->pluck('phone')
            ->mapWithKeys(fn (string $phone) => [$this->normalizePhone($phone) => true])
            ->filter(fn (bool $exists, string $phone) => $phone !== '');
        $existingEmails = Inquiry::query()
            ->whereNotNull('email')
            ->pluck('email')
            ->mapWithKeys(fn (string $email) => [$this->normalizeEmail($email) => true])
            ->filter(fn (bool $exists, string $email) => $email !== '');
        $seenPhones = [];
        $seenEmails = [];
        $duplicateCount = 0;
        $rowsToImport = [];

        foreach ($validated['rows'] as $row) {
            $phone = $this->normalizePhone($row['phone']);
            $email = $this->normalizeEmail($row['email'] ?? null);
            $isDuplicate = isset($existingPhones[$phone])
                || isset($seenPhones[$phone])
                || ($email !== '' && (isset($existingEmails[$email]) || isset($seenEmails[$email])));

            if ($isDuplicate) {
                $duplicateCount++;

                continue;
            }

            $seenPhones[$phone] = true;

            if ($email !== '') {
                $seenEmails[$email] = true;
            }

            $rowsToImport[] = $row;
        }

        $storedPath = $this->storeInquiryImportFile($request);

        try {
            DB::transaction(function () use ($rowsToImport, $request) {
                foreach ($rowsToImport as $row) {
                    if (empty($row['campus_id']) && ! empty($row['campus'])) {
                        $row['campus_id'] = Campus::query()
                            ->where('is_active', true)
                            ->whereRaw('LOWER(name) = ?', [mb_strtolower($row['campus'])])
                            ->value('id');
                    }

                    $row['program_id'] = $this->resolveImportProgramId($row);
                    abort_unless($request->user()->canAccessCampus($row['campus_id'] ?? null), 403);

                    unset(
                        $row['program'],
                        $row['program_name'],
                        $row['program_duration'],
                        $row['duration'],
                    );

                    Inquiry::create($row);
                }
            });
        } catch (\Throwable $exception) {
            if ($storedPath) {
                Storage::disk('local')->delete($storedPath);
            }

            throw $exception;
        }

        $message = count($rowsToImport).' inquiries imported.';

        if ($duplicateCount > 0) {
            $message .= ' '.$duplicateCount.' duplicate inquiries skipped.';
        }

        if ($storedPath) {
            $message .= ' CSV archived as '.basename($storedPath).'.';
        }

        return back()->with('success', $message);
    }

    private function resolveImportProgramId(array $row): ?int
    {
        $duration = trim((string) ($row['program_duration'] ?? $row['duration'] ?? ''));

        if (! empty($row['program_id'])) {
            $program = Program::find($row['program_id']);

            if ($program && $duration !== '' && blank($program->duration)) {
                $program->update(['duration' => $duration]);
            }

            return $program?->id;
        }

        $programName = trim((string) ($row['program'] ?? $row['program_name'] ?? ''));

        if ($programName === '') {
            return null;
        }

        $campusId = $row['campus_id'] ?? null;
        $query = Program::query()
            ->whereRaw('LOWER(name) = ?', [mb_strtolower($programName)]);

        if ($campusId) {
            $query->where('campus_id', $campusId);
        }

        $program = $query->first();

        if (! $program && $campusId) {
            $program = Program::create([
                'campus_id' => $campusId,
                'name' => $programName,
                'duration' => $duration !== '' ? $duration : null,
                'fee' => 0,
            ]);
        }

        if ($program && $duration !== '' && blank($program->duration)) {
            $program->update(['duration' => $duration]);
        }

        return $program?->id;
    }

    private function storeInquiryImportFile(Request $request): ?string
    {
        $file = $request->file('csv_file');

        if (! $file) {
            return null;
        }

        $originalName = Str::slug(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME));
        $originalName = $originalName !== '' ? $originalName : 'upload';
        $filename = 'inquiries-'.now()->format('Y-m-d_His').'-'.$originalName.'-'.Str::lower(Str::random(6)).'.csv';

        $path = $file->storeAs('inquiry-imports', $filename, 'local');

        if (! $path) {
            throw new \RuntimeException('The CSV file could not be archived.');
        }

        return $path;
    }

    private function normalizePhone(?string $phone): string
    {
        return preg_replace('/\D+/', '', $phone ?? '') ?? '';
    }

    private function normalizeEmail(?string $email): string
    {
        return mb_strtolower(trim($email ?? ''));
    }

    // The search method provides a JSON response containing a list of inquiries that match the search query, allowing users to quickly find specific inquiries based on their name, phone number, or email, and ensuring that the search results are relevant and accessible based on the user's permissions and the inquiry's assignment status.
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
            ->with(['program:id,name,campus_id,duration', 'campusModel:id,name', 'assignedUser:id,name', 'streams.user:id,name'])
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
        $inaccessibleCampusExists = Inquiry::query()
            ->whereIn('id', $validated['inquiry_ids'])
            ->whereNotNull('campus_id')
            ->whereNotIn('campus_id', $assignee->campuses()->select('campuses.id'))
            ->exists();

        if ($assignee->role !== UserRole::SuperAdmin && $inaccessibleCampusExists) {
            return back()->withErrors([
                'assigned_user_id' => 'Give the selected employee access to every inquiry campus before assigning them.',
            ]);
        }

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

    // The saveActivity method allows authorized users to add a new activity stream entry for a specific inquiry, optionally updating the inquiry's details and status, and ensuring that all changes are recorded in a single transaction for data integrity and consistency.
    public function saveActivity(SaveInquiryActivityRequest $request, Inquiry $inquiry): RedirectResponse
    {
        Gate::authorize('view', $inquiry);
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
                    'postal_communication' => $validated['postal_communication'],
                    'next_follow_up_at' => $validated['next_follow_up_at'] ?? null,
                ];

                abort_unless($request->user()->canAccessCampus($updates['campus_id']), 403);

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
            'program' => $inquiry->program?->only(['id', 'name', 'campus_id', 'duration']),
            'previous_program' => $inquiry->previous_program,
            'campus_id' => $inquiry->campus_id,
            'campus_model' => $inquiry->campusModel?->only(['id', 'name']),
            'campus' => $inquiry->campus,
            'status' => $inquiry->status,
            'assigned_user_id' => $inquiry->assigned_user_id,
            'assigned_user' => $inquiry->assignedUser?->only(['id', 'name']),
            'department' => $inquiry->department,
            'postal_communication' => $inquiry->postal_communication,
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

    // The visibleInquiryQuery method constructs a base query for retrieving inquiries that are visible to the current user, applying filters based on campus activity and assignment status, ensuring that users only see inquiries they are authorized to access.
    private function visibleInquiryQuery(Request $request, bool $assignedOnly): Builder
    {
        $user = $request->user();

        return $this->applyCampusAccess(Inquiry::query(), $user)
            ->where(function (Builder $query): void {
                $query->whereNull('campus_id')
                    ->orWhereHas('campusModel', fn (Builder $campusQuery) => $campusQuery->where('is_active', true));
            })
            ->when(
                $assignedOnly,
                fn (Builder $query) => $query->where('assigned_user_id', $request->user()->id),
            );
    }

    // The workspaceQuery method builds upon the visibleInquiryQuery by applying additional filters based on the specified queue, allowing for dynamic retrieval of inquiries based on their assignment and follow-up status, and ensuring that the resulting query is tailored to the context of the dashboard or inquiry page.
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

    // The filterCounts method calculates the count of inquiries grouped by various attributes such as status, department, source, campus, and assigned user, based on the current filters and queue selection, providing aggregated data for the frontend to display filter counts and help users understand the distribution of inquiries across different categories.
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
            'program' => $grouped(clone $base, 'program_id'),
            'campus' => $grouped(clone $base, 'campus_id'),
            'assigned_user' => $assignedOnly
                ? []
                : $grouped(clone $base, 'assigned_user_id'),
        ];
    }

    // The queueCounts method calculates the count of inquiries based on their assignment and follow-up status for the dashboard and inquiry pages, providing key metrics such as total inquiries, inquiries assigned today, and follow-ups scheduled for yesterday, today, and the next three days, helping users prioritize their work and manage their inquiry queues effectively.
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

    // The validateReportFilters method validates the incoming request parameters for generating the inquiry report, ensuring that the filters provided by the user are in the correct format and reference existing records where applicable, which helps maintain data integrity and prevents errors during report generation.
    private function validateReportFilters(Request $request): array
    {
        return $request->validate([
            'campus_id' => ['nullable', 'array'],
            'campus_id.*' => ['integer', 'exists:campuses,id'],
            'program_id' => ['nullable', 'array'],
            'program_id.*' => ['integer', 'exists:programs,id'],
            'status' => ['nullable', 'array'],
            'status.*' => [Rule::in(InquiryOptions::STATUSES)],
            'assigned_user_id' => ['nullable', 'array'],
            'assigned_user_id.*' => ['integer', 'exists:users,id'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
        ]);
    }

    // The reportQuery method constructs a query builder instance for retrieving inquiries based on the specified filters for the inquiry report, applying conditions for campus activity, assignment status, and other attributes, and ensuring that the resulting dataset is tailored to the reporting requirements and user permissions.
    private function reportQuery(Request $request, array $filters): Builder
    {
        $canSelectUser = $request->user()->can('assign', Inquiry::class);

        return $this->applyCampusAccess(Inquiry::query(), $request->user())
            ->with([
                'program:id,name,campus_id,duration',
                'campusModel:id,name',
                'assignedUser:id,name',
                'latestStream.user:id,name',
            ])
            ->whereNotNull('assigned_user_id')
            ->where(function (Builder $query) {
                $query->whereNull('campus_id')
                    ->orWhereHas('campusModel', fn (Builder $campusQuery) => $campusQuery->where('is_active', true));
            })
            ->when(
                $canSelectUser,
                fn (Builder $query) => $query->when(
                    $filters['assigned_user_id'] ?? null,
                    fn (Builder $inner, array $userIds) => $inner->whereIn('assigned_user_id', $userIds),
                ),
                fn (Builder $query) => $query->where('assigned_user_id', $request->user()->id),
            )
            ->when($filters['campus_id'] ?? null, fn (Builder $query, array $campusIds) => $query->whereIn('campus_id', $campusIds))
            ->when($filters['program_id'] ?? null, fn (Builder $query, array $programIds) => $query->whereIn('program_id', $programIds))
            ->when($filters['status'] ?? null, fn (Builder $query, array $statuses) => $query->whereIn('status', $statuses))
            ->when($filters['date_from'] ?? null, fn (Builder $query, string $date) => $query->whereDate('updated_at', '>=', $date))
            ->when($filters['date_to'] ?? null, fn (Builder $query, string $date) => $query->whereDate('updated_at', '<=', $date))
            ->latest('updated_at');
    }

    private function applyCampusAccess(Builder $query, User $user): Builder
    {
        if ($user->role === UserRole::SuperAdmin) {
            return $query;
        }

        return $query->where(function (Builder $campusQuery) use ($user): void {
            $campusQuery->whereNull('campus_id')
                ->orWhereIn('campus_id', $user->campuses()->select('campuses.id'));
        });
    }

    private function accessibleCampusQuery(User $user): Builder
    {
        return $user->role === UserRole::SuperAdmin
            ? Campus::query()
            : Campus::query()->whereIn('id', $user->campuses()->select('campuses.id'));
    }

    private function filterNames(string $model, array $ids): ?string
    {
        if ($ids === []) {
            return null;
        }

        return $model::query()->whereIn('id', $ids)->orderBy('name')->pluck('name')->implode(', ');
    }

    // The reportPayload method prepares the data structure for the inquiry report, including metadata about the report generation time and applied filters, aggregated counts of inquiries by status, and a detailed list of inquiries with their relevant attributes, ensuring that the report contains comprehensive information for analysis and presentation in both JSON and PDF formats.
    private function reportPayload($inquiries, array $filters): array
    {
        return [
            'generatedAt' => now()->format('M d, Y h:i A'),
            'filters' => [
                'campus' => $this->filterNames(Campus::class, $filters['campus_id'] ?? []),
                'program' => $this->filterNames(Program::class, $filters['program_id'] ?? []),
                'status' => ($filters['status'] ?? []) === [] ? null : implode(', ', $filters['status']),
                'user' => $this->filterNames(User::class, $filters['assigned_user_id'] ?? []),
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
                'latest_comment' => $inquiry->latestStream?->response,
                'latest_comment_user' => $inquiry->latestStream?->user?->name,
                'latest_comment_at' => $inquiry->latestStream?->created_at?->format('M d, Y h:i A'),
            ])->values(),
        ];
    }
}
