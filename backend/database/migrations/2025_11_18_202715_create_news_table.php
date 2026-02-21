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
        Schema::create('news', function (Blueprint $table) {
            $table->id();

            // Scope
            $table->integer('scope_type');
            $table->integer('scope_id')->nullable();
            $table->foreignId('game_id')->nullable()->constrained('games')->onDelete('set null');

            // Content
            $table->string('slug');
            $table->string('title');
            $table->text('text');
            $table->json('content')->nullable();

            // Publication
            $table->boolean('published')->default(false);
            $table->timestamp('published_at')->nullable();

            // Audit
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');

            $table->timestamps();

            // Indexes
            $table->index(['scope_type', 'scope_id']);
            $table->index('game_id');
            $table->index('published');
            $table->index('published_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('news');
    }
};
