<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::statement("ALTER TABLE inquiries MODIFY postal_communication ENUM('pending', 'send', 'created', 'sent') NOT NULL DEFAULT 'pending'");
        DB::table('inquiries')
            ->where('postal_communication', 'send')
            ->update(['postal_communication' => 'sent']);
        DB::statement("ALTER TABLE inquiries MODIFY postal_communication ENUM('pending', 'created', 'sent') NOT NULL DEFAULT 'pending'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("ALTER TABLE inquiries MODIFY postal_communication ENUM('send', 'pending', 'created', 'sent') NOT NULL DEFAULT 'pending'");
        DB::table('inquiries')
            ->where('postal_communication', 'created')
            ->update(['postal_communication' => 'pending']);
        DB::table('inquiries')
            ->where('postal_communication', 'sent')
            ->update(['postal_communication' => 'send']);
        DB::statement("ALTER TABLE inquiries MODIFY postal_communication ENUM('send', 'pending') NOT NULL DEFAULT 'pending'");
    }
};
