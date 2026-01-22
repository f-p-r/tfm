<?php

namespace Database\Seeders;

use App\Models\RoleGrant;
use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class RoleGrantSeeder extends Seeder
{
    /**
     * Asignar ejemplos iniciales de RoleGrant.
     * - Usuario 1 (admin): admin global
     * - Usuario 2: editor en association 15 (si existe usuario 2)
     */
    public function run(): void
    {
        // Usuario 1: admin global
        $user1 = User::find(1);
        if ($user1) {
            $adminRole = Role::where('name', 'admin')->first();
            if ($adminRole) {
                RoleGrant::firstOrCreate([
                    'user_id' => $user1->id,
                    'role_id' => $adminRole->id,
                    'scope_type' => 'global',
                    'scope_id' => null,
                ]);
            }
        }

        // Usuario 2: editor en association 15 (ejemplo)
        $user2 = User::where('username', '!=', 'admin')->first();
        if ($user2) {
            $editorRole = Role::where('name', 'editor')->first();
            if ($editorRole) {
                RoleGrant::firstOrCreate([
                    'user_id' => $user2->id,
                    'role_id' => $editorRole->id,
                    'scope_type' => 'association',
                    'scope_id' => 15,
                ]);
            }
        }
    }
}
