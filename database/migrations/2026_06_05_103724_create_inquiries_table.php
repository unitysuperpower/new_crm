<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('inquiries')) {
            return;
        }

        Schema::create('inquiries', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('phone');
            $table->string('email')->nullable();
            $table->string('city')->nullable();
            $table->text('address')->nullable();
            $table->string('source')->nullable()->index();
            $table->unsignedBigInteger('program_id')->nullable();
            $table->string('previous_program')->nullable();
            $table->enum('status', ['pending', 'not sure', 'not interested', 'not eligible', 'interested', 'call back',
                'distance problem', 'not responding', 'for job', 'will visit', 'visited', 'p.o', 'online/short course',
                'e-t paid', 'admission fee paid', 'master calsses'])->default('pending');
            $table->foreignId('assigned_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('department', ['admission', 'academics', 'accouts'])->default('admission');
            $table->date('next_follow_up_at')->nullable();
            $table->text('message')->nullable();
            $table->timestamps();

            $table->index('status');
            $table->index('assigned_user_id');
            $table->index('next_follow_up_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inquiries');
    }
};
