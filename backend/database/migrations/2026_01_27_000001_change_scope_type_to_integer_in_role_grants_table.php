<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Primero migrar los datos existentes
        DB::table('role_grants')->where('scope_type', 'global')->update(['scope_type' => '1']);
        DB::table('role_grants')->where('scope_type', 'association')->update(['scope_type' => '2']);
        DB::table('role_grants')->where('scope_type', 'game')->update(['scope_type' => '3']);

        // Cambiar el tipo de columna
        Schema::table('role_grants', function (Blueprint $table) {
            $table->unsignedTinyInteger('scope_type')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Cambiar de vuelta a string
        Schema::table('role_grants', function (Blueprint $table) {
            $table->string('scope_type', 20)->change();
        });

        // Revertir los datos
        DB::table('role_grants')->where('scope_type', '1')->update(['scope_type' => 'global']);
        DB::table('role_grants')->where('scope_type', '2')->update(['scope_type' => 'association']);
        DB::table('role_grants')->where('scope_type', '3')->update(['scope_type' => 'game']);
    }
};
