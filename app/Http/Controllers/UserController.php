<?php

namespace App\Http\Controllers;

use App\Enums\UserPermission;
use App\Enums\UserRole;
use App\Models\User;
use App\Support\InquiryOptions;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    // The index method retrieves and displays a list of users along with their roles and permissions, ensuring that only users with the appropriate permissions can access this information, and provides the necessary data for rendering the user management interface on the frontend.
    public function index(Request $request): Response
    {
        abort_unless($request->user()->hasPermission(UserPermission::ManageUsers), 403);

        return Inertia::render('users/index', [
            'users' => User::query()
                ->orderBy('name')
                ->get()
                ->map(fn (User $user) => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role?->value ?? UserRole::User->value,
                    'role_label' => ($user->role ?? UserRole::User)->label(),
                    'department' => $user->department,
                    'permissions' => $user->permissionValues(),
                ]),
            'roles' => UserRole::options(),
            'departments' => InquiryOptions::DEPARTMENTS,
            'permissions' => collect(UserPermission::cases())
                ->map(fn (UserPermission $permission) => [
                    'value' => $permission->value,
                    'label' => $permission->label(),
                ])
                ->values(),
        ]);
    }

    // The update method handles the updating of a user's role and permissions, ensuring that only users with the appropriate permissions can modify user information, and that the updates are validated before being applied to the database.
    public function update(Request $request, User $user): RedirectResponse
    {
        abort_unless($request->user()->hasPermission(UserPermission::ManageUsers), 403);

        $validated = $request->validate([
            'role' => ['required', Rule::enum(UserRole::class)],
            'department' => ['required', Rule::in(InquiryOptions::DEPARTMENTS)],
            'permissions' => ['array'],
            'permissions.*' => ['string', Rule::enum(UserPermission::class)],
        ]);

        $user->update([
            'role' => UserRole::from($validated['role']),
            'department' => $validated['department'],
            'permissions' => $validated['permissions'] ?? [],
        ]);

        return back()->with('success', 'User permissions updated.');
    }
}
