<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Campus;
use App\Models\Inquiry;
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
        $user->campuses()->attach($campus);

        $this->actingAs($user)
            ->get(route('dashboard'))
            ->assertInertia(fn (Assert $page) => $page
                ->has('campusVisibility', 1)
                ->where('campusVisibility.0.id', $campus->id)
                ->where('campusVisibility.0.name', $campus->name)
                ->where('campusVisibility.0.is_active', true));
    }

    public function test_users_only_receive_inquiries_from_their_assigned_campuses(): void
    {
        $user = User::factory()->create(['role' => UserRole::User]);
        $allowedCampus = Campus::factory()->create(['is_active' => true]);
        $restrictedCampus = Campus::factory()->create(['is_active' => true]);
        $user->campuses()->attach($allowedCampus);

        Inquiry::query()->create([
            'name' => 'Allowed Student',
            'phone' => '03001110001',
            'status' => 'pending',
            'department' => 'admission',
            'assigned_user_id' => $user->id,
            'campus_id' => $allowedCampus->id,
        ]);
        Inquiry::query()->create([
            'name' => 'Restricted Student',
            'phone' => '03001110002',
            'status' => 'pending',
            'department' => 'admission',
            'assigned_user_id' => $user->id,
            'campus_id' => $restrictedCampus->id,
        ]);

        $this->actingAs($user)
            ->get(route('inquiries.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->has('inquiries', 1)
                ->where('inquiries.0.name', 'Allowed Student')
                ->has('campuses', 1)
                ->where('campuses.0.id', $allowedCampus->id));
    }

    public function test_super_admin_can_assign_campus_access_to_an_employee(): void
    {
        $superAdmin = User::factory()->create(['role' => UserRole::SuperAdmin]);
        $employee = User::factory()->create(['role' => UserRole::User]);
        $campus = Campus::factory()->create();

        $this->actingAs($superAdmin)
            ->patch(route('users.update', $employee), [
                'role' => UserRole::User->value,
                'department' => 'admission',
                'permissions' => [],
                'campus_ids' => [$campus->id],
            ])
            ->assertSessionHasNoErrors();

        $this->assertDatabaseHas('campus_user', [
            'campus_id' => $campus->id,
            'user_id' => $employee->id,
        ]);
    }

    public function test_super_admin_cannot_assign_a_campus_inquiry_to_an_employee_without_access(): void
    {
        $superAdmin = User::factory()->create(['role' => UserRole::SuperAdmin]);
        $employee = User::factory()->create(['role' => UserRole::User]);
        $campus = Campus::factory()->create(['is_active' => true]);
        $inquiry = Inquiry::query()->create([
            'name' => 'Campus Student',
            'phone' => '03001110003',
            'status' => 'pending',
            'department' => 'admission',
            'campus_id' => $campus->id,
        ]);

        $this->actingAs($superAdmin)
            ->patch(route('inquiries.assign'), [
                'inquiry_ids' => [$inquiry->id],
                'assigned_user_id' => $employee->id,
            ])
            ->assertSessionHasErrors('assigned_user_id');

        $this->assertNull($inquiry->fresh()->assigned_user_id);
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
