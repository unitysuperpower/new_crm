<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('programs', function (Blueprint $table): void {
            if (! Schema::hasColumn('programs', 'campus_id')) {
                $table->foreignId('campus_id')
                    ->nullable()
                    ->after('id')
                    ->constrained('campuses')
                    ->nullOnDelete();
            }
        });

        $aureaCampusId = DB::table('campuses')->where('name', 'AUREA')->value('id')
            ?? DB::table('campuses')->where('name', 'Aurea')->value('id')
            ?? DB::table('campuses')->orderBy('id')->value('id');
        $iclsCampusId = DB::table('campuses')->where('name', 'ICLS')->value('id');

        if ($aureaCampusId) {
            DB::table('programs')
                ->whereNull('campus_id')
                ->update(['campus_id' => $aureaCampusId]);
        }

        if ($iclsCampusId) {
            DB::table('programs')
                ->whereIn('name', ['(LLB) Bachelor of Laws', '(BTT) Bar Transfer Test'])
                ->update(['campus_id' => $iclsCampusId]);
        }

        Schema::table('programs', function (Blueprint $table): void {
            if (! $this->hasIndex('programs', 'programs_campus_id_name_index')) {
                $table->index(['campus_id', 'name'], 'programs_campus_id_name_index');
            }
        });
    }

    public function down(): void
    {
        Schema::table('programs', function (Blueprint $table): void {
            if ($this->hasIndex('programs', 'programs_campus_id_name_index')) {
                $table->dropIndex('programs_campus_id_name_index');
            }

            if (Schema::hasColumn('programs', 'campus_id')) {
                $table->dropConstrainedForeignId('campus_id');
            }
        });
    }

    private function hasIndex(string $table, string $index): bool
    {
        $database = DB::getDatabaseName();

        return DB::table('information_schema.statistics')
            ->where('table_schema', $database)
            ->where('table_name', $table)
            ->where('index_name', $index)
            ->exists();
    }
};
