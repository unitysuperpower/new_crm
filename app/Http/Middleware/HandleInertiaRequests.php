<?php

namespace App\Http\Middleware;

use App\Enums\UserPermission;
use App\Models\Campus;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $user ? [
                    ...$user->toArray(),
                    'role' => $user->role?->value,
                    'role_label' => $user->role?->label(),
                    'permissions' => $user->permissionValues(),
                ] : null,
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
            'campusVisibility' => $user?->hasPermission(UserPermission::ToggleCampusVisibility)
                ? Campus::query()
                    ->orderBy('name')
                    ->get(['id', 'name', 'is_active'])
                    ->map(fn (Campus $campus) => [
                        'id' => $campus->id,
                        'name' => $campus->name,
                        'is_active' => $campus->is_active,
                    ])
                    ->values()
                : [],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
    }
}
