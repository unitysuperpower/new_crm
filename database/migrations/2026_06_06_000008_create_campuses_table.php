<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('campuses', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('city')->nullable();
            $table->text('address')->nullable();
            $table->timestamps();
        });

        Schema::table('inquiries', function (Blueprint $table) {
            if (! Schema::hasColumn('inquiries', 'campus_id')) {
                $table->foreignId('campus_id')
                    ->nullable()
                    ->after('campus')
                    ->constrained('campuses')
                    ->nullOnDelete();
            }
        });

        if (Schema::hasColumn('inquiries', 'campus')) {
            DB::table('inquiries')
                ->whereNotNull('campus')
                ->where('campus', '!=', '')
                ->distinct()
                ->pluck('campus')
                ->each(function (string $campus): void {
                    DB::table('campuses')->updateOrInsert(
                        ['name' => $campus],
                        ['updated_at' => now(), 'created_at' => now()],
                    );
                });

            DB::table('inquiries')
                ->whereNotNull('campus')
                ->where('campus', '!=', '')
                ->orderBy('id')
                ->get(['id', 'campus'])
                ->each(function ($inquiry): void {
                    $campusId = DB::table('campuses')->where('name', $inquiry->campus)->value('id');

                    if ($campusId) {
                        DB::table('inquiries')->where('id', $inquiry->id)->update(['campus_id' => $campusId]);
                    }
                });
        }
    }

    public function down(): void
    {
        Schema::table('inquiries', function (Blueprint $table) {
            if (Schema::hasColumn('inquiries', 'campus_id')) {
                $table->dropConstrainedForeignId('campus_id');
            }
        });

        Schema::dropIfExists('campuses');
    }
};
