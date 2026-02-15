<?php

namespace Database\Seeders;

use App\Models\ContactInfo;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ContactInfoSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Contactos globales de Naipeando
        $globalContacts = [
            [
                'owner_type' => ContactInfo::OWNER_TYPE_GLOBAL,
                'owner_id' => null,
                'contact_type' => 'email',
                'value' => 'soporte@naipeando.com',
                'category' => 'support',
                'label' => 'Soporte técnico',
                'order' => 10,
                'is_public' => true,
            ],
            [
                'owner_type' => ContactInfo::OWNER_TYPE_GLOBAL,
                'owner_id' => null,
                'contact_type' => 'email',
                'value' => 'prensa@naipeando.com',
                'category' => 'press',
                'label' => 'Contacto de prensa',
                'order' => 20,
                'is_public' => true,
            ],
            [
                'owner_type' => ContactInfo::OWNER_TYPE_GLOBAL,
                'owner_id' => null,
                'contact_type' => 'email',
                'value' => 'info@naipeando.com',
                'category' => 'general',
                'label' => 'Información general',
                'order' => 1,
                'is_public' => true,
            ],
            [
                'owner_type' => ContactInfo::OWNER_TYPE_GLOBAL,
                'owner_id' => null,
                'contact_type' => 'twitter',
                'value' => 'https://twitter.com/naipeando',
                'category' => null,
                'label' => null,
                'order' => 200,
                'is_public' => true,
            ],
            [
                'owner_type' => ContactInfo::OWNER_TYPE_GLOBAL,
                'owner_id' => null,
                'contact_type' => 'discord',
                'value' => 'https://discord.gg/naipeando',
                'category' => null,
                'label' => 'Comunidad Discord',
                'order' => 210,
                'is_public' => true,
            ],
        ];

        foreach ($globalContacts as $contact) {
            ContactInfo::firstOrCreate(
                [
                    'owner_type' => $contact['owner_type'],
                    'owner_id' => $contact['owner_id'],
                    'contact_type' => $contact['contact_type'],
                    'value' => $contact['value'],
                ],
                $contact
            );
        }
    }
}
