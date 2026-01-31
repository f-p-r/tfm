<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CountryRegionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Insertar España
        DB::table('countries')->insert([
            'id' => 'ES',
            'iso_alpha3' => 'ESP',
            'name' => 'España',
            'phone_code' => '34',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Insertar Comunidades Autónomas de España
        DB::table('regions')->insert([
            ['id' => 'ES-AN', 'country_id' => 'ES', 'name' => 'Andalucía', 'created_at' => now(), 'updated_at' => now()],
            ['id' => 'ES-AR', 'country_id' => 'ES', 'name' => 'Aragón', 'created_at' => now(), 'updated_at' => now()],
            ['id' => 'ES-AS', 'country_id' => 'ES', 'name' => 'Asturias', 'created_at' => now(), 'updated_at' => now()],
            ['id' => 'ES-IB', 'country_id' => 'ES', 'name' => 'Baleares', 'created_at' => now(), 'updated_at' => now()],
            ['id' => 'ES-CN', 'country_id' => 'ES', 'name' => 'Canarias', 'created_at' => now(), 'updated_at' => now()],
            ['id' => 'ES-CB', 'country_id' => 'ES', 'name' => 'Cantabria', 'created_at' => now(), 'updated_at' => now()],
            ['id' => 'ES-CL', 'country_id' => 'ES', 'name' => 'Castilla y León', 'created_at' => now(), 'updated_at' => now()],
            ['id' => 'ES-CM', 'country_id' => 'ES', 'name' => 'Castilla-La Mancha', 'created_at' => now(), 'updated_at' => now()],
            ['id' => 'ES-CT', 'country_id' => 'ES', 'name' => 'Cataluña', 'created_at' => now(), 'updated_at' => now()],
            ['id' => 'ES-VC', 'country_id' => 'ES', 'name' => 'Comunitat Valenciana', 'created_at' => now(), 'updated_at' => now()],
            ['id' => 'ES-EX', 'country_id' => 'ES', 'name' => 'Extremadura', 'created_at' => now(), 'updated_at' => now()],
            ['id' => 'ES-GA', 'country_id' => 'ES', 'name' => 'Galicia', 'created_at' => now(), 'updated_at' => now()],
            ['id' => 'ES-MD', 'country_id' => 'ES', 'name' => 'Madrid', 'created_at' => now(), 'updated_at' => now()],
            ['id' => 'ES-MC', 'country_id' => 'ES', 'name' => 'Murcia', 'created_at' => now(), 'updated_at' => now()],
            ['id' => 'ES-NC', 'country_id' => 'ES', 'name' => 'Navarra', 'created_at' => now(), 'updated_at' => now()],
            ['id' => 'ES-PV', 'country_id' => 'ES', 'name' => 'País Vasco', 'created_at' => now(), 'updated_at' => now()],
            ['id' => 'ES-RI', 'country_id' => 'ES', 'name' => 'La Rioja', 'created_at' => now(), 'updated_at' => now()],
            ['id' => 'ES-CE', 'country_id' => 'ES', 'name' => 'Ceuta', 'created_at' => now(), 'updated_at' => now()],
            ['id' => 'ES-ML', 'country_id' => 'ES', 'name' => 'Melilla', 'created_at' => now(), 'updated_at' => now()],
        ]);
    }
}
