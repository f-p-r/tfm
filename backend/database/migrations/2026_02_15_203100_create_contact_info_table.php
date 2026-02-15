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
        Schema::create('contact_info', function (Blueprint $table) {
            $table->id();

            // Ownership: Global (1), Association (2), Game (3)
            $table->unsignedTinyInteger('owner_type');
            $table->unsignedBigInteger('owner_id')->nullable();

            // Tipo de contacto
            $table->string('contact_type', 50);
            // Valores: 'email', 'phone', 'whatsapp', 'facebook', 'instagram',
            //          'twitter', 'discord', 'telegram', 'youtube', 'twitch',
            //          'linkedin', 'tiktok', 'web', 'address'

            // Valor del contacto (email, número, URL, handle, dirección)
            $table->string('value', 512);

            // Categoría para emails/whatsapp (NULL para redes sociales)
            $table->string('category', 50)->nullable();
            // Valores: 'general', 'support', 'membership', 'events', 'press', 'admin', 'other'

            // Etiqueta/descripción personalizada (opcional)
            $table->string('label', 255)->nullable();

            // Orden de visualización
            $table->unsignedInteger('order')->default(0);

            // Visibilidad
            $table->boolean('is_public')->default(true);

            $table->timestamps();

            // Índices
            $table->index(['owner_type', 'owner_id'], 'idx_owner');
            $table->index('contact_type', 'idx_type');
            $table->index('category', 'idx_category');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('contact_info');
    }
};
