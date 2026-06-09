<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCampusRequest;
use App\Http\Requests\UpdateCampusRequest;
use App\Models\Campus;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class CampusController extends Controller
{
    // The index method retrieves and displays a list of campuses, allowing for optional search filtering, and provides metrics on the total number of campuses, those with inquiries, and those without inquiries, while ensuring that the user has the necessary permissions to view the campuses.
    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', Campus::class);

        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
        ]);

        $campuses = Campus::query()
            ->withCount('inquiries')
            ->when($filters['search'] ?? null, function ($query, string $search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('city', 'like', "%{$search}%")
                    ->orWhere('address', 'like', "%{$search}%");
            })
            ->orderBy('name')
            ->get()
            ->map(fn (Campus $campus) => [
                'id' => $campus->id,
                'name' => $campus->name,
                'city' => $campus->city,
                'address' => $campus->address,
                'is_active' => $campus->is_active,
                'inquiries_count' => $campus->inquiries_count,
                'created_at' => $campus->created_at?->format('M d, Y'),
                'can_delete' => $campus->inquiries_count === 0,
            ]);

        return Inertia::render('campuses/index', [
            'filters' => [
                'search' => $filters['search'] ?? '',
            ],
            'campuses' => $campuses,
            'metrics' => [
                'total' => $campuses->count(),
                'active' => $campuses->where('is_active', true)->count(),
                'inactive' => $campuses->where('is_active', false)->count(),
                'withInquiries' => $campuses->where('inquiries_count', '>', 0)->count(),
                'unused' => $campuses->where('inquiries_count', 0)->count(),
            ],
        ]);
    }

    // The store method handles the creation of a new campus by validating the incoming request data, creating a new Campus record in the database, and then redirecting back to the previous page with a success message, ensuring that only authorized users can perform this action.
    public function store(StoreCampusRequest $request): RedirectResponse
    {
        Campus::create($request->validated());

        return back()->with('success', 'Campus created.');
    }
    // The update method allows authorized users to modify the details of an existing campus, ensuring that the information remains accurate and up-to-date as the campus progresses through different stages of development.                       
    public function update(UpdateCampusRequest $request, Campus $campus): RedirectResponse
    {
        $campus->update($request->validated());

        return back()->with('success', 'Campus updated.');
    }

    // The toggle method allows authorized users to enable or disable a campus by updating its active status, ensuring that the campus can be easily managed without needing to delete it, and providing feedback on the action taken.
    public function toggle(Request $request, Campus $campus): RedirectResponse
    {
        Gate::authorize('update', $campus);

        $validated = $request->validate([
            'is_active' => ['required', 'boolean'],
        ]);

        $campus->update(['is_active' => $validated['is_active']]);

        return back()->with('success', $campus->is_active ? 'Campus enabled.' : 'Campus disabled.');
    }

    // The destroy method allows authorized users to delete a campus, ensuring that the campus has no associated inquiries before proceeding, and providing feedback on the action taken.
    public function destroy(Campus $campus): RedirectResponse
    {
        Gate::authorize('delete', $campus);

        if ($campus->inquiries()->exists()) {
            return back()->withErrors([
                'campus' => 'This campus has inquiries and cannot be deleted.',
            ]);
        }

        $campus->delete();

        return back()->with('success', 'Campus deleted.');
    }
}
