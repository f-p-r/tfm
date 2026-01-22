# Sistema de Permisos por Scope (Spatie + RoleGrant)

## Descripción

Sistema de autorización con roles y permisos que soporta múltiples ámbitos (scopes):
- **Global:** aplica a toda la plataforma
- **Association:** aplica dentro de una asociación específica
- **Game:** aplica dentro de un juego específico

Un usuario puede tener diferentes roles asignados en diferentes scopes.

## Componentes

### 1. RoleGrant (Modelo)
Tabla que relaciona Usuario + Rol + Scope (tipo + id).

```bash
php artisan migrate
```

Estructura:
- `user_id` - FK a users
- `role_id` - FK a roles (Spatie)
- `scope_type` - global|association|game
- `scope_id` - ID del scope (nullable si global)
- Índice único: (user_id, role_id, scope_type, scope_id)

### 2. AuthorizationService

Servicio que evalúa permisos en un scope.

**Métodos:**
- `userHasPermissionInScope(User $user, string $permission, string $scopeType, ?int $scopeId): bool`
  - Verifica si el usuario tiene el permiso en ese scope
  - Un grant global da acceso en cualquier scope
  - Optimizado: carga roleGrants con relaciones eager (roles y permisos)
  
- `getScopeForContent(?int $associationId, ?int $gameId): array`
  - Devuelve el scope de un contenido (prioridad: association > game > global)

**Uso en controladores:**

```php
use App\Services\AuthorizationService;

$authService = app(AuthorizationService::class);

// Verificar si puede crear noticia en association 5
if ($authService->userHasPermissionInScope($user, 'news.create', 'association', 5)) {
    // Permitir
}
```

### 3. Policies

`NewsPolicy` ejemplo:
- `create($user, $associationId, $gameId)` - Requiere permiso `news.create`
- `update($user, $news)` - Requiere permiso `news.update`
- `publish($user, $news)` - Requiere permiso `news.publish`

Registrada en `AppServiceProvider::boot()`.

**Uso en controladores:**

```php
// Verificar autorización
$this->authorize('create', [News::class, $associationId, $gameId]);
$this->authorize('update', $news);
$this->authorize('publish', $news);
```

### 4. Roles y Permisos

Seeders: `RolePermissionSeeder` y `RoleGrantSeeder`

**Roles predefinidos:**
- `admin` - Todos los permisos
- `moderator` - news.create, news.update, news.publish
- `editor` - news.create, news.update

**Permisos iniciales:**
- news.create, news.update, news.publish
- tournament.create, tournament.update, tournament.delete
- users.manage

**Ejemplos asignados:**
- Usuario 1 (admin): role admin en scope global
- Usuario 2: role editor en scope association 15

## Ejemplo: Asignar RoleGrant en Tinker

```php
use App\Models\User;
use App\Models\RoleGrant;
use Spatie\Permission\Models\Role;

// Usuario 2 es moderator en association 5
$user = User::find(2);
$modRole = Role::where('name', 'moderator')->first();

RoleGrant::create([
    'user_id' => $user->id,
    'role_id' => $modRole->id,
    'scope_type' => 'association',
    'scope_id' => 5,
]);

// Verificar
$authService = app(\App\Services\AuthorizationService::class);
$authService->userHasPermissionInScope($user, 'news.publish', 'association', 5); // true
$authService->userHasPermissionInScope($user, 'news.publish', 'association', 6); // false
```

## Flujo de Lógica

### Verificar permiso en contenido (ej: News)

1. Contenido tiene `association_id = 5` → scope = association:5
2. Llamar `$authService->userHasPermissionInScope($user, 'news.update', 'association', 5)`
3. Servicio busca RoleGrants del usuario:
   - ¿Global + permiso? → true
   - ¿association:5 + permiso? → true
   - Si no → false

### Prioridad de scopes

- Si contenido tiene `association_id` → evalúa por association, ignora game_id
- Else si tiene `game_id` → evalúa por game
- Else → evalúa global

## Comandos Útiles

```bash
# Ejecutar migraciones
php artisan migrate

# Crear roles/permisos iniciales
php artisan db:seed --class=RolePermissionSeeder

# Asignar RoleGrants de ejemplo
php artisan db:seed --class=RoleGrantSeeder

# Tinker para gestionar
php artisan tinker
```

## Próximas mejoras

- Agregar más policies (Tournament, Association)
- API endpoints para gestionar RoleGrants
- Caché de permisos por usuario/scope
- Auditoría de cambios de permisos
