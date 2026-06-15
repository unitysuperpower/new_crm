<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Campus;
use App\Models\Inquiry;
use App\Models\Stream;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class InquiryWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_assigned_user_cannot_update_inquiry_without_a_discussion_stream(): void
    {
        $user = User::factory()->create();
        $inquiry = $this->createInquiry(['assigned_user_id' => $user->id]);

        $this->actingAs($user)
            ->patch(route('inquiries.activity.save', $inquiry), [
                'status' => 'interested',
                'department' => 'accounts',
                'next_follow_up_at' => '2026-06-20',
            ])
            ->assertSessionHasErrors('response');

        $this->assertDatabaseHas('inquiries', [
            'id' => $inquiry->id,
            'status' => 'pending',
            'department' => 'admission',
        ]);
        $this->assertDatabaseCount('streams', 0);
    }

    public function test_assigned_user_can_update_inquiry_and_add_stream_in_one_action(): void
    {
        $user = User::factory()->create();
        $inquiry = $this->createInquiry(['assigned_user_id' => $user->id]);

        $this->actingAs($user)
            ->patch(route('inquiries.activity.save', $inquiry), [
                'name' => 'Updated Student Name',
                'phone' => '03009998888',
                'city' => 'Lahore',
                'status' => 'will visit',
                'department' => 'academics',
                'next_follow_up_at' => '2026-06-25',
                'response' => 'Student confirmed a campus visit.',
            ])
            ->assertSessionHasNoErrors()
            ->assertSessionHas('success', 'Inquiry and discussion updated.');

        $this->assertDatabaseHas('inquiries', [
            'id' => $inquiry->id,
            'name' => 'Updated Student Name',
            'phone' => '03009998888',
            'city' => 'Lahore',
            'status' => 'will visit',
            'department' => 'academics',
            'next_follow_up_at' => '2026-06-25',
        ]);
        $this->assertDatabaseHas('streams', [
            'inquiry_id' => $inquiry->id,
            'user_id' => $user->id,
            'response' => 'Student confirmed a campus visit.',
            'last_status' => 'will visit',
        ]);
    }

    public function test_admin_can_update_complete_details_for_any_inquiry(): void
    {
        $admin = User::factory()->create(['role' => UserRole::Admin]);
        $inquiry = $this->createInquiry([
            'assigned_user_id' => User::factory()->create()->id,
        ]);

        $this->actingAs($admin)
            ->patch(route('inquiries.activity.save', $inquiry), [
                'name' => 'Admin Updated Student',
                'phone' => '03003334444',
                'email' => 'updated@example.com',
                'city' => 'Islamabad',
                'address' => 'Updated address',
                'source' => 'Referral',
                'previous_program' => 'Intermediate',
                'message' => 'Updated initial inquiry message.',
                'status' => 'interested',
                'department' => 'accounts',
                'next_follow_up_at' => '2026-06-30',
                'response' => 'Admin reviewed and corrected the full inquiry.',
            ])
            ->assertSessionHasNoErrors();

        $this->assertDatabaseHas('inquiries', [
            'id' => $inquiry->id,
            'name' => 'Admin Updated Student',
            'email' => 'updated@example.com',
            'city' => 'Islamabad',
            'source' => 'Referral',
            'department' => 'accounts',
        ]);
    }

    public function test_regular_user_is_auto_assigned_with_their_department_when_creating_an_inquiry(): void
    {
        $user = User::factory()->create(['department' => 'academics']);
        $otherUser = User::factory()->create(['department' => 'accounts']);

        $this->actingAs($user)
            ->post(route('inquiries.store'), [
                'name' => 'Auto Assigned Student',
                'phone' => '03001110000',
                'status' => 'pending',
                'assigned_user_id' => $otherUser->id,
                'department' => 'accounts',
            ])
            ->assertSessionHasNoErrors();

        $this->assertDatabaseHas('inquiries', [
            'name' => 'Auto Assigned Student',
            'assigned_user_id' => $user->id,
            'department' => 'academics',
        ]);
    }

    public function test_super_admin_can_select_assignee_and_department_when_creating_an_inquiry(): void
    {
        $superAdmin = User::factory()->create(['role' => UserRole::SuperAdmin]);
        $assignee = User::factory()->create(['department' => 'academics']);

        $this->actingAs($superAdmin)
            ->post(route('inquiries.store'), [
                'name' => 'Admin Assigned Student',
                'phone' => '03002220000',
                'status' => 'pending',
                'assigned_user_id' => $assignee->id,
                'department' => 'accounts',
            ])
            ->assertSessionHasNoErrors();

        $this->assertDatabaseHas('inquiries', [
            'name' => 'Admin Assigned Student',
            'assigned_user_id' => $assignee->id,
            'department' => 'accounts',
        ]);
    }

    public function test_unassigned_user_can_only_add_a_stream_through_activity_action(): void
    {
        $assignedUser = User::factory()->create();
        $viewer = User::factory()->create();
        $inquiry = $this->createInquiry(['assigned_user_id' => $assignedUser->id]);

        $this->actingAs($viewer)
            ->patch(route('inquiries.activity.save', $inquiry), [
                'response' => 'Handled the call while the assigned employee was absent.',
            ])
            ->assertSessionHasNoErrors()
            ->assertSessionHas('success', 'Discussion added.');

        $this->assertSame(1, Stream::query()->where('inquiry_id', $inquiry->id)->count());
        $this->assertDatabaseHas('inquiries', [
            'id' => $inquiry->id,
            'status' => 'pending',
            'department' => 'admission',
        ]);

        $this->actingAs($viewer)
            ->patch(route('inquiries.activity.save', $inquiry), [
                'status' => 'visited',
                'department' => 'accounts',
                'response' => 'Attempted update.',
            ])
            ->assertSessionHasErrors(['status', 'department']);
    }

    public function test_dashboard_filters_return_the_expected_inquiry(): void
    {
        $superAdmin = User::factory()->create(['role' => UserRole::SuperAdmin]);
        $assignedUser = User::factory()->create(['name' => 'Assigned Employee']);
        $campus = Campus::query()->create(['name' => 'Main Campus', 'is_active' => true]);
        $otherCampus = Campus::query()->create(['name' => 'Other Campus', 'is_active' => true]);

        $target = $this->createInquiry([
            'name' => 'Unique Student',
            'phone' => '03001112222',
            'email' => 'unique@example.com',
            'source' => 'Website',
            'status' => 'interested',
            'department' => 'accounts',
            'assigned_user_id' => $assignedUser->id,
            'campus_id' => $campus->id,
            'assigned_at' => now(),
        ]);
        $other = $this->createInquiry([
            'name' => 'Different Student',
            'source' => 'Facebook',
            'status' => 'pending',
            'department' => 'admission',
            'campus_id' => $otherCampus->id,
            'assigned_user_id' => User::factory()->create()->id,
            'assigned_at' => now(),
        ]);
        $other->timestamps = false;
        $other->forceFill([
            'created_at' => now()->subDay(),
            'updated_at' => now()->subDay(),
        ])->saveQuietly();

        $filters = [
            ['search' => 'Unique Student'],
            ['status' => 'interested'],
            ['department' => 'accounts'],
            ['assigned_user_id' => $assignedUser->id],
            ['source' => 'Website'],
            ['campus_id' => $campus->id],
            ['date_from' => today()->toDateString(), 'date_to' => today()->toDateString()],
        ];

        foreach ($filters as $filter) {
            $this->actingAs($superAdmin)
                ->get(route('dashboard', $filter))
                ->assertOk()
                ->assertInertia(fn (Assert $page) => $page
                    ->where('pagination.total', 1)
                    ->where('inquiries.0.id', $target->id));
        }
    }

    public function test_csv_import_does_not_create_an_unknown_campus(): void
    {
        $superAdmin = User::factory()->create(['role' => UserRole::SuperAdmin]);

        $this->actingAs($superAdmin)
            ->post(route('inquiries.import'), [
                'rows' => [[
                    'name' => 'Imported Student',
                    'phone' => '03009998888',
                    'campus' => 'Unknown CSV Campus',
                    'status' => 'pending',
                    'department' => 'admission',
                ]],
            ])
            ->assertSessionHasNoErrors();

        $this->assertDatabaseMissing('campuses', ['name' => 'Unknown CSV Campus']);
        $this->assertDatabaseHas('inquiries', [
            'name' => 'Imported Student',
            'campus' => 'Unknown CSV Campus',
            'campus_id' => null,
        ]);
    }

    public function test_csv_import_cannot_assign_an_inquiry_to_a_user(): void
    {
        $superAdmin = User::factory()->create(['role' => UserRole::SuperAdmin]);
        $assignee = User::factory()->create();

        $this->actingAs($superAdmin)
            ->post(route('inquiries.import'), [
                'rows' => [[
                    'name' => 'Assigned Through CSV',
                    'phone' => '03007776666',
                    'assigned_user_id' => $assignee->id,
                    'status' => 'pending',
                    'department' => 'admission',
                ]],
            ])
            ->assertSessionHasErrors('rows.0.assigned_user_id');

        $this->assertDatabaseMissing('inquiries', [
            'name' => 'Assigned Through CSV',
        ]);
    }

    public function test_csv_import_archives_the_file_and_skips_duplicate_inquiries(): void
    {
        Storage::fake('local');
        $superAdmin = User::factory()->create(['role' => UserRole::SuperAdmin]);
        $this->createInquiry([
            'phone' => '0300-111-2222',
            'email' => 'existing@example.com',
        ]);

        $response = $this->actingAs($superAdmin)
            ->post(route('inquiries.import'), [
                'csv_file' => UploadedFile::fake()->createWithContent(
                    'June Admissions.csv',
                    "name,phone,email\nExisting,03001112222,new@example.com\nNew Student,03009998888,new@example.com",
                ),
                'rows' => [
                    [
                        'name' => 'Existing Student',
                        'phone' => '03001112222',
                        'email' => 'different@example.com',
                        'status' => 'pending',
                        'department' => 'admission',
                    ],
                    [
                        'name' => 'New Student',
                        'phone' => '03009998888',
                        'email' => 'new@example.com',
                        'status' => 'pending',
                        'department' => 'admission',
                    ],
                    [
                        'name' => 'Repeated New Student',
                        'phone' => '03008887777',
                        'email' => 'NEW@example.com',
                        'status' => 'pending',
                        'department' => 'admission',
                    ],
                ],
            ]);

        $response->assertSessionHasNoErrors();
        $response->assertSessionHas('success', function (string $message): bool {
            return str_contains($message, '1 inquiries imported.')
                && str_contains($message, '2 duplicate inquiries skipped.')
                && str_contains($message, 'CSV archived as inquiries-');
        });

        $this->assertDatabaseHas('inquiries', ['name' => 'New Student']);
        $this->assertDatabaseMissing('inquiries', ['name' => 'Existing Student']);
        $this->assertDatabaseMissing('inquiries', ['name' => 'Repeated New Student']);

        $files = Storage::disk('local')->files('inquiry-imports');
        $this->assertCount(1, $files);
        $this->assertMatchesRegularExpression(
            '/^inquiry-imports\/inquiries-\d{4}-\d{2}-\d{2}_\d{6}-june-admissions-[a-z0-9]{6}\.csv$/',
            $files[0],
        );
    }

    public function test_ajax_search_returns_only_the_users_assigned_inquiries(): void
    {
        $user = User::factory()->create();
        $match = $this->createInquiry([
            'name' => 'Searchable Student',
            'assigned_user_id' => $user->id,
        ]);
        $this->createInquiry([
            'name' => 'Searchable Other Student',
            'assigned_user_id' => User::factory()->create()->id,
        ]);

        $this->actingAs($user)
            ->getJson(route('inquiries.search', [
                'query' => 'Searchable',
                'mode' => 'assigned',
            ]))
            ->assertOk()
            ->assertJsonCount(1, 'results')
            ->assertJsonPath('results.0.id', $match->id);
    }

    public function test_dashboard_exposes_counts_for_filter_options(): void
    {
        $superAdmin = User::factory()->create(['role' => UserRole::SuperAdmin]);
        $assignedUser = User::factory()->create();
        $assignment = [
            'assigned_user_id' => $assignedUser->id,
            'assigned_at' => now(),
        ];
        $this->createInquiry([...$assignment, 'status' => 'pending', 'source' => 'Website']);
        $this->createInquiry([...$assignment, 'status' => 'pending', 'source' => 'Facebook']);
        $this->createInquiry([...$assignment, 'status' => 'interested', 'source' => 'Website']);

        $this->actingAs($superAdmin)
            ->get(route('dashboard'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('filterCounts.status.pending', 2)
                ->where('filterCounts.status.interested', 1)
                ->where('filterCounts.source.Website', 2));
    }

    public function test_inquiry_page_only_contains_the_signed_in_users_assignments(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $assigned = $this->createInquiry([
            'assigned_user_id' => $user->id,
            'next_follow_up_at' => today(),
        ]);
        $this->createInquiry([
            'assigned_user_id' => $otherUser->id,
            'next_follow_up_at' => today(),
        ]);

        $this->actingAs($user)
            ->get(route('inquiries.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('pageMode', 'assigned')
                ->where('pagination.total', 1)
                ->where('inquiries.0.id', $assigned->id));
    }

    public function test_dashboard_shows_all_inquiries_including_unassigned_and_older_records(): void
    {
        $superAdmin = User::factory()->create(['role' => UserRole::SuperAdmin]);
        $assignedUser = User::factory()->create();
        $today = $this->createInquiry([
            'name' => 'Created Today Without Assignment',
        ]);
        $yesterday = $this->createInquiry([
            'name' => 'Created Yesterday But Assigned Today',
            'assigned_user_id' => $assignedUser->id,
            'assigned_at' => now(),
        ]);
        $yesterday->timestamps = false;
        $yesterday->forceFill([
            'created_at' => now()->subDay(),
            'updated_at' => now()->subDay(),
        ])->saveQuietly();

        $this->actingAs($superAdmin)
            ->get(route('dashboard'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('pagination.total', 2)
                ->where('inquiries.0.id', $today->id)
                ->where('queueCounts.total_inquiries', 2)
                ->where('queueCounts.assigned_today', 1));
    }

    public function test_inquiry_today_tab_shows_only_follow_ups_due_today(): void
    {
        $user = User::factory()->create();
        $today = $this->createInquiry([
            'assigned_user_id' => $user->id,
            'next_follow_up_at' => today(),
        ]);
        $this->createInquiry([
            'assigned_user_id' => $user->id,
            'next_follow_up_at' => today()->addDay(),
        ]);

        $this->actingAs($user)
            ->get(route('inquiries.index', ['queue' => 'today']))
            ->assertInertia(fn (Assert $page) => $page
                ->where('filters.queue', 'today')
                ->where('pagination.total', 1)
                ->where('inquiries.0.id', $today->id)
                ->where('queueCounts.follow_ups_today', 1));
    }

    public function test_assigned_today_tab_uses_the_correct_dashboard_and_employee_scope(): void
    {
        $superAdmin = User::factory()->create(['role' => UserRole::SuperAdmin]);
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $usersToday = $this->createInquiry([
            'assigned_user_id' => $user->id,
            'assigned_at' => now(),
        ]);
        $this->createInquiry([
            'assigned_user_id' => $otherUser->id,
            'assigned_at' => now(),
        ]);
        $this->createInquiry([
            'assigned_user_id' => $user->id,
            'assigned_at' => now()->subDay(),
        ]);

        $this->actingAs($superAdmin)
            ->get(route('dashboard', ['queue' => 'assigned_today']))
            ->assertInertia(fn (Assert $page) => $page
                ->where('filters.queue', 'assigned_today')
                ->where('pagination.total', 2)
                ->where('queueCounts.assigned_today', 2));

        $this->actingAs($user)
            ->get(route('inquiries.index', ['queue' => 'assigned_today']))
            ->assertInertia(fn (Assert $page) => $page
                ->where('filters.queue', 'assigned_today')
                ->where('pagination.total', 1)
                ->where('queueCounts.assigned_today', 1)
                ->where('inquiries.0.id', $usersToday->id));
    }

    public function test_inquiry_follow_up_tabs_filter_yesterday_and_next_three_days(): void
    {
        $user = User::factory()->create();
        $yesterday = $this->createInquiry([
            'assigned_user_id' => $user->id,
            'next_follow_up_at' => today()->subDay(),
        ]);
        $tomorrow = $this->createInquiry([
            'assigned_user_id' => $user->id,
            'next_follow_up_at' => today()->addDay(),
        ]);
        $this->createInquiry([
            'assigned_user_id' => $user->id,
            'next_follow_up_at' => today()->addDays(4),
        ]);

        $this->actingAs($user)
            ->get(route('inquiries.index', ['queue' => 'yesterday']))
            ->assertInertia(fn (Assert $page) => $page
                ->where('pagination.total', 1)
                ->where('inquiries.0.id', $yesterday->id)
                ->where('queueCounts.follow_ups_yesterday', 1));

        $this->actingAs($user)
            ->get(route('inquiries.index', ['queue' => 'next_3_days']))
            ->assertInertia(fn (Assert $page) => $page
                ->where('pagination.total', 1)
                ->where('inquiries.0.id', $tomorrow->id)
                ->where('queueCounts.follow_ups_next_3_days', 1));
    }

    public function test_assigned_inquiry_without_a_follow_up_date_is_still_visible(): void
    {
        $user = User::factory()->create();
        $inquiry = $this->createInquiry([
            'assigned_user_id' => $user->id,
            'next_follow_up_at' => null,
        ]);

        $this->actingAs($user)
            ->get(route('inquiries.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('pagination.total', 1)
                ->where('inquiries.0.id', $inquiry->id));
    }

    public function test_sent_postal_communication_has_a_downloadable_invitation_letter(): void
    {
        $user = User::factory()->create();
        $inquiry = $this->createInquiry([
            'name' => 'Letter Student',
            'email' => 'letter@example.com',
            'address' => '12 Education Road, Lahore',
            'assigned_user_id' => $user->id,
            'postal_communication' => 'send',
        ]);

        $response = $this->actingAs($user)
            ->get(route('inquiries.invitation-letter', $inquiry));

        $response->assertOk()
            ->assertHeader('content-type', 'application/pdf')
            ->assertDownload('student-inquiry-Letter-Student.pdf');

        $this->assertStringStartsWith('%PDF', $response->getContent());
    }

    public function test_pending_postal_communication_cannot_download_an_invitation_letter(): void
    {
        $user = User::factory()->create();
        $inquiry = $this->createInquiry([
            'assigned_user_id' => $user->id,
            'postal_communication' => 'pending',
        ]);

        $this->actingAs($user)
            ->get(route('inquiries.invitation-letter', $inquiry))
            ->assertNotFound();
    }

    private function createInquiry(array $attributes = []): Inquiry
    {
        return Inquiry::query()->create(array_merge([
            'name' => 'Test Student',
            'phone' => '03001234567',
            'status' => 'pending',
            'department' => 'admission',
        ], $attributes));
    }
}
