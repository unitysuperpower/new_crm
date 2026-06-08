<?php

namespace App\Http\Controllers;

use App\Enums\UserPermission;
use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
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
                    'permissions' => $user->permissionValues(),
                ]),
            'roles' => UserRole::options(),
            'permissions' => collect(UserPermission::cases())
                ->map(fn (UserPermission $permission) => [
                    'value' => $permission->value,
                    'label' => $permission->label(),
                ])
                ->values(),
        ]);
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        abort_unless($request->user()->hasPermission(UserPermission::ManageUsers), 403);

        $validated = $request->validate([
            'role' => ['required', Rule::enum(UserRole::class)],
            'permissions' => ['array'],
            'permissions.*' => ['string', Rule::enum(UserPermission::class)],
        ]);

        $user->update([
            'role' => UserRole::from($validated['role']),
            'permissions' => $validated['permissions'] ?? [],
        ]);

        return back()->with('success', 'User permissions updated.');
    }
}
