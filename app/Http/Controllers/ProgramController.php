<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreProgramRequest;
use App\Http\Requests\UpdateProgramRequest;
use App\Models\Program;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class ProgramController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', Program::class);

        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
        ]);

        $programs = Program::query()
            ->withCount('inquiries')
            ->when($filters['search'] ?? null, function ($query, string $search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('duration', 'like', "%{$search}%");
            })
            ->orderBy('name')
            ->get()
            ->map(fn (Program $program) => [
                'id' => $program->id,
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
            ],
            'programs' => $programs,
            'metrics' => [
                'total' => $programs->count(),
                'withInquiries' => $programs->where('inquiries_count', '>', 0)->count(),
                'unused' => $programs->where('inquiries_count', 0)->count(),
            ],
        ]);
    }

    public function store(StoreProgramRequest $request): RedirectResponse
    {
        Program::create($request->validated());

        return back()->with('success', 'Program created.');
    }

    public function update(UpdateProgramRequest $request, Program $program): RedirectResponse
    {
        $program->update($request->validated());

        return back()->with('success', 'Program updated.');
    }

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
