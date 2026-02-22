<?php

namespace Database\Seeders;

use App\Models\EventAttendanceStatusType;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class EventAttendanceStatusTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $types = [
            ['id' => EventAttendanceStatusType::PENDING,  'name' => 'Solicitud pendiente'],
            ['id' => EventAttendanceStatusType::ADMITTED, 'name' => 'Admitido'],
            ['id' => EventAttendanceStatusType::REJECTED, 'name' => 'Rechazado'],
        ];

        foreach ($types as $type) {
            EventAttendanceStatusType::firstOrCreate(['id' => $type['id']], $type);
        }
    }
}
