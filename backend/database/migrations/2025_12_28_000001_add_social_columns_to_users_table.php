<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Social columns
            $table->string('provider')->nullable()->after('remember_token');
            $table->string('provider_id')->nullable()->after('provider');
            $table->string('avatar')->nullable()->after('provider_id');

            // Make email nullable to support providers without email
            $table->string('email')->nullable()->change();

            // Composite unique for provider+provider_id
            $table->unique(['provider', 'provider_id']);
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['provider', 'provider_id']);
            $table->dropColumn(['provider', 'provider_id', 'avatar']);

            // Revert email back to non-nullable
            $table->string('email')->nullable(false)->change();
        });
    }
};
