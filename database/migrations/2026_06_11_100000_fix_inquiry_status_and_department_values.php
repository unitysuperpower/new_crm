<?php

use App\Support\InquiryOptions;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() === 'mysql') {
            $this->alterEnums([...InquiryOptions::STATUSES, 'master calsses'], [...InquiryOptions::DEPARTMENTS, 'accouts']);
        }

        DB::table('inquiries')->where('status', 'master calsses')->update(['status' => 'master classes']);
        DB::table('inquiries')->where('department', 'accouts')->update(['department' => 'accounts']);

        if (DB::getDriverName() === 'mysql') {
            $this->alterEnums(InquiryOptions::STATUSES, InquiryOptions::DEPARTMENTS);
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'mysql') {
            $this->alterEnums([...InquiryOptions::STATUSES, 'master calsses'], [...InquiryOptions::DEPARTMENTS, 'accouts']);
        }

        DB::table('inquiries')->where('status', 'master classes')->update(['status' => 'master calsses']);
        DB::table('inquiries')->where('department', 'accounts')->update(['department' => 'accouts']);

        if (DB::getDriverName() === 'mysql') {
            $legacyStatuses = collect(InquiryOptions::STATUSES)
                ->map(fn (string $status) => $status === 'master classes' ? 'master calsses' : $status)
                ->all();
            $legacyDepartments = collect(InquiryOptions::DEPARTMENTS)
                ->map(fn (string $department) => $department === 'accounts' ? 'accouts' : $department)
                ->all();

            $this->alterEnums($legacyStatuses, $legacyDepartments);
        }
    }

    private function alterEnums(array $statuses, array $departments): void
    {
        $statusValues = collect($statuses)->unique()->map(fn (string $value) => DB::getPdo()->quote($value))->implode(',');
        $departmentValues = collect($departments)->unique()->map(fn (string $value) => DB::getPdo()->quote($value))->implode(',');

        DB::statement("ALTER TABLE inquiries MODIFY status ENUM({$statusValues}) NOT NULL DEFAULT 'pending'");
        DB::statement("ALTER TABLE inquiries MODIFY department ENUM({$departmentValues}) NOT NULL DEFAULT 'admission'");
    }
};
