<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreProgramRequest;
use App\Http\Requests\UpdateProgramRequest;
use App\Models\Campus;
use App\Models\Program;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class ProgramController extends Controller
{
    // The index method retrieves and displays a list of programs, allowing for optional search filtering, and provides metrics on the total number of programs, those with inquiries, and those without inquiries, while ensuring that the user has the necessary permissions to view the programs.
    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', Program::class);

        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'campus_id' => ['nullable', 'integer', 'exists:campuses,id'],
        ]);

        $programs = Program::query()
            ->with('campus:id,name')
            ->withCount('inquiries')
            ->when($filters['search'] ?? null, function ($query, string $search) {
                $query->where(function ($inner) use ($search): void {
                    $inner->where('name', 'like', "%{$search}%")
                        ->orWhere('duration', 'like', "%{$search}%")
                        ->orWhereHas('campus', fn ($campusQuery) => $campusQuery->where('name', 'like', "%{$search}%"));
                });
            })
            ->when($filters['campus_id'] ?? null, fn ($query, int $campusId) => $query->where('campus_id', $campusId))
            ->orderByRaw('campus_id IS NULL')
            ->orderBy(
                Campus::query()
                    ->select('name')
                    ->whereColumn('campuses.id', 'programs.campus_id')
                    ->limit(1),
            )
            ->orderBy('name')
            ->get()
            ->map(fn (Program $program) => [
                'id' => $program->id,
                'campus_id' => $program->campus_id,
                'campus' => $program->campus?->only(['id', 'name']),
                'name' => $program->name,
                'duration' => $program->duration,
                'fee' => $program->fee,
                'inquiries_count' => $program->inquiries_count,
                'created_at' => $program->created_at?->format('M d, Y'),
                'can_delete' => $program->inquiries_count === 0,
            ]);

        return Inertia::render('programs/index', [
            'filters' => [
                'search' => $filters['search'] ?? '',
                'campus_id' => $filters['campus_id'] ?? '',
            ],
            'programs' => $programs,
            'campuses' => Campus::query()
                ->orderBy('name')
                ->get(['id', 'name', 'is_active']),
            'metrics' => [
                'total' => $programs->count(),
                'withInquiries' => $programs->where('inquiries_count', '>', 0)->count(),
                'unused' => $programs->where('inquiries_count', 0)->count(),
            ],
        ]);
    }

    // The store method handles the creation of a new program by validating the incoming request data, creating a new Program record in the database, and then redirecting back to the previous page with a success message, ensuring that only authorized users can perform this action.
    public function store(StoreProgramRequest $request): RedirectResponse
    {
        Program::create($request->validated());

        return back()->with('success', 'Program created.');
    }

    // The update method allows authorized users to modify the details of an existing program, ensuring that the information remains accurate and up-to-date as the program progresses through different stages of development.
    public function update(UpdateProgramRequest $request, Program $program): RedirectResponse
    {
        $program->update($request->validated());

        return back()->with('success', 'Program updated.');
    }

    // The destroy method allows authorized users to delete a program, but only if it has no associated inquiries, ensuring data integrity and preventing accidental deletion of programs that are currently in use.
    public function destroy(Program $program): RedirectResponse
    {
        Gate::authorize('delete', $program);

        if ($program->inquiries()->exists()) {
            return back()->withErrors([
                'program' => 'This program has inquiries and cannot be deleted.',
            ]);
        }

        $program->delete();

        return back()->with('success', 'Program deleted.');
    }
}
