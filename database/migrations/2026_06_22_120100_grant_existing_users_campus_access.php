<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $campusIds = DB::table('campuses')->pluck('id');

        if ($campusIds->isEmpty()) {
            return;
        }

        DB::table('users')
            ->where(function ($query): void {
                $query->whereNull('role')->orWhere('role', '!=', 'super_admin');
            })
            ->orderBy('id')
            ->chunkById(100, function ($users) use ($campusIds): void {
                $now = now();
                $rows = [];

                foreach ($users as $user) {
                    foreach ($campusIds as $campusId) {
                        $rows[] = [
                            'campus_id' => $campusId,
                            'user_id' => $user->id,
                            'created_at' => $now,
                            'updated_at' => $now,
                        ];
                    }
                }

                DB::table('campus_user')->insertOrIgnore($rows);
            });
    }

    public function down(): void
    {
        // Access is managed by Super Admin after this one-time compatibility migration.
    }
};
