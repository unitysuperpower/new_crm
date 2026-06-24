<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('inquiries', 'scholarship_percentage')) {
            return;
        }

        Schema::table('inquiries', function (Blueprint $table): void {
            $table->decimal('scholarship_percentage', 5, 2)
                ->nullable()
                ->after('postal_communication');
        });
    }

    public function down(): void
    {
        if (! Schema::hasColumn('inquiries', 'scholarship_percentage')) {
            return;
        }

        Schema::table('inquiries', function (Blueprint $table): void {
            $table->dropColumn('scholarship_percentage');
        });
    }
};
