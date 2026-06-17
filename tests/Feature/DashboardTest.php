<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Campus;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page()
    {
        $user = User::factory()->create();
        $team = $user->currentTeam;

        $response = $this->get(route('dashboard'));
        $response->assertRedirect(route('login'));
    }

    public function test_authenticated_users_can_visit_the_dashboard()
    {
        $user = User::factory()->create();
        $team = $user->currentTeam;

        $response = $this
            ->actingAs($user)
            ->get(route('dashboard'));

        $response->assertOk();
    }

    public function test_campus_managers_receive_sidebar_visibility_controls(): void
    {
        $user = User::factory()->create(['role' => UserRole::SuperAdmin]);
        $campus = Campus::factory()->create(['is_active' => true]);

        $this->actingAs($user)
            ->get(route('dashboard'))
            ->assertInertia(fn (Assert $page) => $page
                ->has('campusVisibility', 1)
                ->where('campusVisibility.0.id', $campus->id)
                ->where('campusVisibility.0.name', $campus->name)
                ->where('campusVisibility.0.is_active', true));
    }

    public function test_role_users_receive_sidebar_visibility_controls(): void
    {
        $user = User::factory()->create(['role' => UserRole::User]);
        $campus = Campus::factory()->create(['is_active' => true]);

        $this->actingAs($user)
            ->get(route('dashboard'))
            ->assertInertia(fn (Assert $page) => $page
                ->has('campusVisibility', 1)
                ->where('campusVisibility.0.id', $campus->id)
                ->where('campusVisibility.0.name', $campus->name)
                ->where('campusVisibility.0.is_active', true));
    }

    public function test_custom_restricted_users_do_not_receive_campus_controls(): void
    {
        $user = User::factory()->create([
            'role' => UserRole::User,
            'permissions' => ['inquiry:view'],
        ]);
        Campus::factory()->create();

        $this->actingAs($user)
            ->get(route('dashboard'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('campusVisibility', []));
    }

    public function test_super_admin_can_open_user_management(): void
    {
        $user = User::factory()->create(['role' => UserRole::SuperAdmin]);

        $this->actingAs($user)
            ->get(route('users.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('users/index')
                ->has('users'));
    }
}
