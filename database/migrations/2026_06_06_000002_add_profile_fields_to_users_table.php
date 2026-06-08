<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('father_name')->nullable()->after('name');
            $table->string('cnic_no')->nullable()->unique()->after('father_name');
            $table->date('date_of_birth')->nullable()->after('cnic_no');
            $table->string('gender')->nullable()->after('date_of_birth');
            $table->string('religion')->nullable()->after('gender');
            $table->string('blood_group')->nullable()->after('religion');
            $table->string('marital_status')->nullable()->after('blood_group');
            $table->string('nationality')->nullable()->after('marital_status');
            $table->string('domicile')->nullable()->after('nationality');
            $table->string('personal_email')->nullable()->after('email');
            $table->string('official_email')->nullable()->after('personal_email');
            $table->string('mobile_no')->nullable()->after('official_email');
            $table->string('current_city')->nullable()->after('mobile_no');
            $table->string('emergency_contact_name')->nullable()->after('current_city');
            $table->string('emergency_contact_relationship')->nullable()->after('emergency_contact_name');
            $table->string('emergency_contact_number')->nullable()->after('emergency_contact_relationship');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['cnic_no']);
            $table->dropColumn([
                'father_name',
                'cnic_no',
                'date_of_birth',
                'gender',
                'religion',
                'blood_group',
                'marital_status',
                'nationality',
                'domicile',
                'personal_email',
                'official_email',
                'mobile_no',
                'current_city',
                'emergency_contact_name',
                'emergency_contact_relationship',
                'emergency_contact_number',
            ]);
        });
    }
};
