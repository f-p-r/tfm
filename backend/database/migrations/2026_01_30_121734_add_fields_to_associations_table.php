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
        Schema::table('associations', function (Blueprint $table) {
            $table->string('name')->unique()->after('id');
            $table->string('slug', 64)->unique()->after('name');
            $table->boolean('disabled')->default(false)->after('slug');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('associations', function (Blueprint $table) {
            $table->dropColumn(['name', 'slug', 'disabled']);
        });
    }
};
