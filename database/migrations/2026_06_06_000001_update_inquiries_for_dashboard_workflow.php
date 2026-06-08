<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Upgrade older inquiry tables without deleting existing inquiry data.
     */
    public function up(): void
    {
        Schema::table('inquiries', function (Blueprint $table) {
            if (! Schema::hasColumn('inquiries', 'team_id')) {
                $table->foreignId('team_id')->nullable()->after('id')->constrained()->nullOnDelete();
            }

            if (! Schema::hasColumn('inquiries', 'next_follow_up_at')) {
                $table->date('next_follow_up_at')->nullable()->after('department');
            }
        });

        if (Schema::hasColumn('inquiries', 'previous_program_id') && ! Schema::hasColumn('inquiries', 'previous_program')) {
            Schema::table('inquiries', function (Blueprint $table) {
                $table->renameColumn('previous_program_id', 'previous_program');
            });
        }

        $fallbackTeamId = DB::table('teams')->orderBy('id')->value('id');

        if ($fallbackTeamId !== null) {
            DB::table('inquiries')
                ->whereNull('team_id')
                ->update(['team_id' => $fallbackTeamId]);
        }

        Schema::table('inquiries', function (Blueprint $table) {
            if (! $this->hasIndex('inquiries', 'inquiries_team_id_status_index')) {
                $table->index(['team_id', 'status']);
            }

            if (! $this->hasIndex('inquiries', 'inquiries_team_id_assigned_user_id_index')) {
                $table->index(['team_id', 'assigned_user_id']);
            }

            if (! $this->hasIndex('inquiries', 'inquiries_team_id_next_follow_up_at_index')) {
                $table->index(['team_id', 'next_follow_up_at']);
            }
        });
    }

    public function down(): void
    {
        Schema::table('inquiries', function (Blueprint $table) {
            if ($this->hasIndex('inquiries', 'inquiries_team_id_status_index')) {
                $table->dropIndex('inquiries_team_id_status_index');
            }

            if ($this->hasIndex('inquiries', 'inquiries_team_id_assigned_user_id_index')) {
                $table->dropIndex('inquiries_team_id_assigned_user_id_index');
            }

            if ($this->hasIndex('inquiries', 'inquiries_team_id_next_follow_up_at_index')) {
                $table->dropIndex('inquiries_team_id_next_follow_up_at_index');
            }

            if (Schema::hasColumn('inquiries', 'next_follow_up_at')) {
                $table->dropColumn('next_follow_up_at');
            }

            if (Schema::hasColumn('inquiries', 'team_id')) {
                $table->dropConstrainedForeignId('team_id');
            }
        });

        if (Schema::hasColumn('inquiries', 'previous_program') && ! Schema::hasColumn('inquiries', 'previous_program_id')) {
            Schema::table('inquiries', function (Blueprint $table) {
                $table->renameColumn('previous_program', 'previous_program_id');
            });
        }
    }

    private function hasIndex(string $table, string $index): bool
    {
        return collect(Schema::getIndexes($table))->contains(fn (array $existing) => $existing['name'] === $index);
    }
};
