<?php

namespace Database\Seeders;

use App\Models\AssociationMemberStatusType;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class AssociationMemberStatusTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $types = [
            ['name' => 'Solicitud de ingreso'],
            ['name' => 'Activo'],
            ['name' => 'Incidencias'],
            ['name' => 'Alerta'],
        ];

        foreach ($types as $type) {
            AssociationMemberStatusType::firstOrCreate($type);
        }
    }
}
