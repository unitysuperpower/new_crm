<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Inquiry;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InquiryReportTest extends TestCase
{
    use RefreshDatabase;

    public function test_regular_users_only_report_their_assigned_inquiries_by_updated_date(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();

        $included = $this->createInquiry($user, 'interested');
        $excluded = $this->createInquiry($otherUser, 'pending');
        $included->timestamps = false;
        $included->forceFill(['updated_at' => '2026-06-11 10:00:00'])->saveQuietly();
        $excluded->timestamps = false;
        $excluded->forceFill(['updated_at' => '2026-06-11 11:00:00'])->saveQuietly();

        $response = $this->actingAs($user)->getJson(route('inquiries.report', [
            'date_from' => '2026-06-11',
            'date_to' => '2026-06-11',
        ]));

        $response
            ->assertOk()
            ->assertJsonPath('total', 1)
            ->assertJsonPath('statusCounts.interested', 1)
            ->assertJsonPath('inquiries.0.id', $included->id);
    }

    public function test_super_admin_can_download_a_filtered_pdf_report(): void
    {
        $superAdmin = User::factory()->create(['role' => UserRole::SuperAdmin]);
        $assignedUser = User::factory()->create();
        $this->createInquiry($assignedUser, 'pending');

        $response = $this->actingAs($superAdmin)->get(route('inquiries.report.pdf', [
            'assigned_user_id' => $assignedUser->id,
            'status' => 'pending',
        ]));

        $response
            ->assertOk()
            ->assertHeader('content-type', 'application/pdf');

        $this->assertStringStartsWith('%PDF', $response->getContent());
    }

    private function createInquiry(User $user, string $status): Inquiry
    {
        return Inquiry::query()->create([
            'name' => 'Report Student',
            'phone' => '03001234567',
            'status' => $status,
            'assigned_user_id' => $user->id,
            'department' => 'admission',
        ]);
    }
}
