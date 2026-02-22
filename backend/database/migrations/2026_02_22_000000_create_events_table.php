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
        Schema::create('events', function (Blueprint $table) {
            $table->id();

            // Scope (same pattern as News)
            // scope_type: 1=global, 2=association, 3=game
            // game_id: informable only when scope_type is 2 or 3; auto-filled from scope_id when scope_type is 3
            $table->integer('scope_type');
            $table->integer('scope_id')->nullable();
            $table->foreignId('game_id')->nullable()->constrained('games')->onDelete('set null');

            // Content
            $table->string('slug');
            $table->string('title');
            $table->text('text');               // Short description for card
            $table->json('content')->nullable(); // Rich web content

            // Dates
            $table->timestamp('starts_at');
            $table->timestamp('ends_at')->nullable();

            // Address (all optional)
            $table->char('country_code', 2)->nullable();
            $table->string('region_id')->nullable();    // FK to regions (string PK)
            $table->string('province_name')->nullable();
            $table->string('municipality_name')->nullable();
            $table->char('postal_code', 5)->nullable();
            $table->string('street_name')->nullable();
            $table->string('street_number', 20)->nullable();

            // Status
            $table->boolean('active')->default(true);              // Event is visible/active
            $table->boolean('registration_open')->default(false); // Attendance requests accepted

            // Publication
            $table->boolean('published')->default(false);
            $table->timestamp('published_at')->nullable();

            // Audit
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');

            $table->timestamps();

            // Foreign keys
            $table->foreign('country_code')->references('id')->on('countries')->onDelete('set null');
            $table->foreign('region_id')->references('id')->on('regions')->onDelete('set null');

            // Indexes
            $table->index(['scope_type', 'scope_id']);
            $table->index('game_id');
            $table->index('starts_at');
            $table->index('ends_at');
            $table->index('published');
            $table->index('published_at');
            $table->index('country_code');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('events');
    }
};
