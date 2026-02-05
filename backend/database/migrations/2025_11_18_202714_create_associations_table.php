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
        Schema::create('associations', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('shortname', 20)->unique()->nullable();
            $table->string('slug', 64)->unique();
            $table->boolean('disabled')->default(false);
            $table->text('description')->nullable();
            $table->char('country_id', 2)->nullable();
            $table->string('region_id')->nullable();
            $table->string('web', 2048)->nullable();
            $table->integer('homePageId')->nullable();
            $table->unsignedBigInteger('owner_id')->nullable();
            $table->string('external_url')->nullable();
            $table->boolean('management')->default(false);
            $table->string('province')->nullable();
            $table->timestamps();

            $table->foreign('owner_id')->references('id')->on('users')->onDelete('set null');
        });
    }
    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('associations');
    }
};
