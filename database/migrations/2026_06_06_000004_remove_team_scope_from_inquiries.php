<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('inquiries', function (Blueprint $table) {
            if (Schema::hasColumn('inquiries', 'team_id')) {
                $table->dropForeign(['team_id']);
            }

            foreach ([
                'inquiries_team_id_status_index',
                'inquiries_team_id_assigned_user_id_index',
                'inquiries_team_id_next_follow_up_at_index',
            ] as $index) {
                if ($this->hasIndex('inquiries', $index)) {
                    $table->dropIndex($index);
                }
            }

            if (Schema::hasColumn('inquiries', 'team_id')) {
                $table->dropColumn('team_id');
            }

            if (! $this->hasIndex('inquiries', 'inquiries_status_index')) {
                $table->index('status');
            }

            if (! $this->hasIndex('inquiries', 'inquiries_assigned_user_id_index')) {
                $table->index('assigned_user_id');
            }

            if (! $this->hasIndex('inquiries', 'inquiries_next_follow_up_at_index')) {
                $table->index('next_follow_up_at');
            }
        });
    }

    public function down(): void
    {
        Schema::table('inquiries', function (Blueprint $table) {
            if (! Schema::hasColumn('inquiries', 'team_id')) {
                $table->foreignId('team_id')->nullable()->after('id')->constrained()->nullOnDelete();
            }
        });
    }

    private function hasIndex(string $table, string $index): bool
    {
        return collect(Schema::getIndexes($table))->contains(fn (array $existing) => $existing['name'] === $index);
    }
};
