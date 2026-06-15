<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('inquiries', function (Blueprint $table): void {
            $table->timestamp('assigned_at')->nullable()->after('assigned_user_id')->index();
            $table->timestamp('last_activity_at')->nullable()->after('next_follow_up_at')->index();
        });

        DB::table('inquiries')
            ->whereNotNull('assigned_user_id')
            ->whereNull('assigned_at')
            ->update(['assigned_at' => DB::raw('updated_at')]);
    }

    public function down(): void
    {
        Schema::table('inquiries', function (Blueprint $table): void {
            $table->dropColumn(['assigned_at', 'last_activity_at']);
        });
    }
};
