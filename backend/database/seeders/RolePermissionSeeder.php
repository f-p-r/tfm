<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RolePermissionSeeder extends Seeder
{
    /**
     * Crear roles y permisos iniciales.
     */
    public function run(): void
    {
        // Limpiar caché de permisos
        app()['cache']->forget('spatie.permission.cache');

        // Crear permisos
        $permissions = [
            'news.create',
            'news.update',
            'news.publish',
            'tournament.create',
            'tournament.update',
            'tournament.delete',
            'users.manage',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        // Crear roles
        $admin = Role::firstOrCreate(['name' => 'admin']);
        $moderator = Role::firstOrCreate(['name' => 'moderator']);
        $editor = Role::firstOrCreate(['name' => 'editor']);

        // Editor: puede crear, actualizar noticias
        $editor->syncPermissions([
            'news.create',
            'news.update',
        ]);

        // Moderador: tiene permisos de editor + publicar
        $moderator->syncPermissions([
            'news.create',
            'news.update',
            'news.publish',
        ]);

        // Admin: tiene todos los permisos
        $admin->syncPermissions(Permission::pluck('name')->toArray());
    }
}
