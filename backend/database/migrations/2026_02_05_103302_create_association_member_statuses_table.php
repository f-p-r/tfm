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
        Schema::create('association_member_statuses', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('association_id');
            $table->unsignedSmallInteger('type');
            $table->smallInteger('order');
            $table->string('name');
            $table->text('description')->nullable();
            $table->timestamps();

            $table->foreign('association_id')->references('id')->on('associations')->onDelete('cascade');
            $table->foreign('type')->references('id')->on('association_member_status_types')->onDelete('restrict');

            $table->unique(['association_id', 'name']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('association_member_statuses');
    }
};
