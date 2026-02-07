# Sistema de Gestión de Autorizaciones

## Visión General

El sistema de autorizaciones implementado combina **Spatie Permission** (para gestión de roles y permisos) con un sistema personalizado de **scopes** (ámbitos) que permite asignar permisos a nivel global, por asociación o por juego.

**Características principales:**
- Roles y permisos gestionados por Spatie Permission
- Sistema de scopes que permite permisos contextualizados
- API para consultar permisos del usuario en múltiples scopes
- Servicios y policies para verificación de autorizaciones

---

## Arquitectura del Sistema

### 1. Componentes Base

#### **Roles y Permisos (Spatie)**
- **Roles**: grupos de permisos (admin, moderator, editor, etc.)
- **Permisos**: acciones específicas (news.create, news.update, tournament.manage, etc.)
- Gestionados por las tablas de Spatie: `roles`, `permissions`, `role_has_permissions`

#### **RoleGrant (Modelo personalizado)**
Tabla que relaciona usuarios con roles en scopes específicos:
- `user_id` - Usuario que recibe el permiso
- `role_id` - Rol asignado (FK a tabla `roles` de Spatie)
- `scope_type` - Tipo de ámbito (1=global, 2=association, 3=game)
- `scope_id` - ID del ámbito (null para global)

**Clave única**: `(user_id, role_id, scope_type, scope_id)`

---

## Tipos de Scopes

### **Scope Type 1: Global**
```php
RoleGrant::SCOPE_GLOBAL = 1
```
- **Ámbito**: Toda la plataforma
- **scope_id**: `null`
- **Uso**: Administradores de plataforma, moderadores globales
- **Ejemplo**: Admin con todos los permisos en toda la plataforma

### **Scope Type 2: Association**
```php
RoleGrant::SCOPE_ASSOCIATION = 2
```
- **Ámbito**: Una asociación específica
- **scope_id**: ID de la asociación
- **Uso**: Administradores de club, moderadores de asociación
- **Ejemplo**: Moderador del Club XYZ (association_id = 5)

### **Scope Type 3: Game**
```php
RoleGrant::SCOPE_GAME = 3
```
- **Ámbito**: Un juego específico
- **scope_id**: ID del juego
- **Uso**: Administradores de juego, moderadores de comunidad de juego
- **Ejemplo**: Moderador de League of Legends (game_id = 1)

---

## Servicios de Autorización

### **AuthorizationService**
Ubicación: `app/Services/AuthorizationService.php`

#### Método: `userHasPermissionInScope()`
Verifica si un usuario tiene un permiso específico en un scope dado.

**Lógica:**
- Busca RoleGrants del usuario que coincidan exactamente con `scope_type` y `scope_id`
- Para cada grant, verifica si el rol asociado tiene el permiso solicitado
- Retorna `true` si encuentra al menos un grant con el permiso

```php
$authService->userHasPermissionInScope(
    user: $user,
    permission: 'news.create',
    scopeType: RoleGrant::SCOPE_ASSOCIATION,
    scopeId: 5
); // true o false
```

**Nota importante**: Este servicio **NO** implementa herencia de permisos globales. Un grant global no da acceso automático a scopes específicos.

#### Método: `getScopeForContent()`
Determina el scope de un contenido basándose en sus relaciones.

**Prioridad:**
1. Si tiene `association_id` → scope association
2. Else si tiene `game_id` → scope game
3. Else → scope global

```php
$scope = $authService->getScopeForContent(
    associationId: 5,
    gameId: null
); 
// ['scope_type' => 2, 'scope_id' => 5]
```

---

### **AuthzService**
Ubicación: `app/Services/AuthzService.php`

Servicio avanzado para consultas complejas de permisos que soporta:
- **Wildcards**: Grants con `scope_id = null` dentro de un scope_type
- **Consultas múltiples**: Verificar permisos en múltiples scope_ids simultáneamente
- **Breakdown**: Devolver permisos específicos por cada scope_id

#### Método: `queryPermissions()`

**Parámetros:**
- `user`: Usuario a consultar
- `scopeType`: Tipo de scope (1, 2 o 3)
- `scopeIds`: Array de IDs de scopes a consultar (puede estar vacío)
- `permissions`: Array de permisos a filtrar (vacío = todos)
- `breakdown`: Boolean - devolver detalle por scope_id

**Lógica de Wildcards:**
- Un grant con `scope_type=2, scope_id=null` da permisos en TODAS las asociaciones
- Un grant con `scope_type=3, scope_id=null` da permisos en TODOS los juegos

**Respuesta con `breakdown=false`:**
```json
{
  "scopeType": 2,
  "all": false,
  "scopeIds": [5, 10, 15]
}
```
- `all`: true si tiene wildcard grant
- `scopeIds`: IDs donde tiene permisos específicos

**Respuesta con `breakdown=true`:**
```json
{
  "scopeType": 2,
  "all": true,
  "allPermissions": ["news.create", "news.update", "news.publish"],
  "results": [
    {
      "scopeId": 5,
      "permissions": ["news.create", "news.update"]
    },
    {
      "scopeId": 10,
      "permissions": ["tournament.create"]
    }
  ]
}
```
- `allPermissions`: permisos del wildcard grant (si existe)
- `results`: permisos específicos por cada scopeId

---

## API de Consulta de Permisos

### **POST /api/authz/query**

**Autenticación:** Requerida (Sanctum)

**Controlador:** `AuthzController@query`

**Request Body:**
```json
{
  "scopeType": 2,
  "scopeIds": [5, 10, 15],
  "permissions": ["news.create", "news.update"],
  "breakdown": true
}
```

**Validación:**
- `scopeType`: required, integer, in:1,2,3
- `scopeIds`: present, array (puede estar vacío)
- `scopeIds.*`: integer, min:1
- `permissions`: present, array (puede estar vacío)
- `permissions.*`: string
- `breakdown`: required, boolean

**Casos de Uso:**

#### 1. Verificar acceso a asociaciones específicas
```json
{
  "scopeType": 2,
  "scopeIds": [5, 10],
  "permissions": [],
  "breakdown": false
}
```
Responde con qué asociaciones (5 o 10) tienen algún permiso.

#### 2. Obtener permisos detallados por asociación
```json
{
  "scopeType": 2,
  "scopeIds": [5, 10],
  "permissions": [],
  "breakdown": true
}
```
Responde con permisos específicos en cada asociación.

#### 3. Verificar permisos específicos
```json
{
  "scopeType": 2,
  "scopeIds": [],
  "permissions": ["news.create", "news.publish"],
  "breakdown": false
}
```
Responde con todas las asociaciones donde tiene esos permisos.

**Debug Logging:**
El controlador tiene un flag `$enableDebugLogging` que puede activarse para registrar requests en `storage/logs/laravel.log`.

---

## Modelo RoleGrant

### Constantes y Mapeos

```php
class RoleGrant extends Model
{
    // Constantes
    const SCOPE_GLOBAL = 1;
    const SCOPE_ASSOCIATION = 2;
    const SCOPE_GAME = 3;

    // String -> Integer
    const SCOPE_TYPES = [
        'global' => 1,
        'association' => 2,
        'game' => 3,
    ];

    // Integer -> String
    const SCOPE_TYPE_NAMES = [
        1 => 'global',
        2 => 'association',
        3 => 'game',
    ];
}
```

### Métodos

#### `getScopeTypeName(): string`
Obtiene el nombre del scope type.
```php
$grant->getScopeTypeName(); // 'association'
```

#### `scopeTypeToInt(string|int $scopeType): ?int`
Convierte string o numérico a integer de scope type.
```php
RoleGrant::scopeTypeToInt('association'); // 2
RoleGrant::scopeTypeToInt('2'); // 2
RoleGrant::scopeTypeToInt(2); // 2
```

### Relaciones

```php
$grant->user(); // BelongsTo User
$grant->role(); // BelongsTo Spatie\Permission\Models\Role
$grant->role->permissions; // Permisos del rol
```

---

## Roles y Permisos Predefinidos

### Roles Iniciales
Definidos en `RolePermissionSeeder`:

- **admin** - Administrador con todos los permisos
- **moderator** - Moderador con permisos de gestión de contenido
- **editor** - Editor con permisos básicos de contenido

### Permisos Iniciales

**Noticias:**
- `news.create` - Crear noticias
- `news.update` - Editar noticias
- `news.publish` - Publicar/despublicar noticias

**Torneos:**
- `tournament.create` - Crear torneos
- `tournament.update` - Editar torneos
- `tournament.delete` - Eliminar torneos

**Usuarios:**
- `users.manage` - Gestionar usuarios

---

## Ejemplos de Uso

### Asignar Rol Global a Usuario
```php
use App\Models\RoleGrant;
use Spatie\Permission\Models\Role;

$user = User::find(1);
$adminRole = Role::where('name', 'admin')->first();

RoleGrant::create([
    'user_id' => $user->id,
    'role_id' => $adminRole->id,
    'scope_type' => RoleGrant::SCOPE_GLOBAL,
    'scope_id' => null,
]);
```

### Asignar Rol en Asociación Específica
```php
$user = User::find(2);
$modRole = Role::where('name', 'moderator')->first();

RoleGrant::create([
    'user_id' => $user->id,
    'role_id' => $modRole->id,
    'scope_type' => RoleGrant::SCOPE_ASSOCIATION,
    'scope_id' => 5, // Club XYZ
]);
```

### Asignar Wildcard en Asociaciones
```php
// Este grant da permisos en TODAS las asociaciones
RoleGrant::create([
    'user_id' => $user->id,
    'role_id' => $modRole->id,
    'scope_type' => RoleGrant::SCOPE_ASSOCIATION,
    'scope_id' => null, // Wildcard
]);
```

### Verificar Permiso desde Controlador
```php
use App\Services\AuthorizationService;

class NewsController extends Controller
{
    public function store(Request $request, AuthorizationService $authService)
    {
        $associationId = $request->input('association_id');
        
        $hasPermission = $authService->userHasPermissionInScope(
            $request->user(),
            'news.create',
            RoleGrant::SCOPE_ASSOCIATION,
            $associationId
        );

        if (!$hasPermission) {
            abort(403, 'No tienes permiso para crear noticias en esta asociación');
        }

        // Crear noticia...
    }
}
```

### Consultar Permisos del Usuario Actual
```javascript
// Desde el frontend
const response = await fetch('/api/authz/query', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    scopeType: 2, // Asociaciones
    scopeIds: [5, 10, 15],
    permissions: ['news.create', 'news.update'],
    breakdown: true
  })
});

const result = await response.json();
// result.all = true/false (tiene wildcard?)
// result.results = [{scopeId: 5, permissions: [...]}, ...]
```

---

## Políticas de Autorización (Policies)

### NewsPolicy
Ubicación: `app/Policies/NewsPolicy.php`

Ejemplo de policy que usa el sistema de scopes:

```php
class NewsPolicy
{
    public function create(User $user, ?int $associationId, ?int $gameId): bool
    {
        $authService = app(AuthorizationService::class);
        $scope = $authService->getScopeForContent($associationId, $gameId);
        
        return $authService->userHasPermissionInScope(
            $user,
            'news.create',
            $scope['scope_type'],
            $scope['scope_id']
        );
    }
}
```

**Uso en controlador:**
```php
$this->authorize('create', [News::class, $associationId, $gameId]);
```

---

## Flujo de Verificación de Permisos

### Caso: Usuario quiere crear noticia en asociación

1. **Request**: `POST /api/news` con `association_id: 5`
2. **Controlador**: Llama a `AuthorizationService`
3. **Determinar scope**: `getScopeForContent(5, null)` → `{type: 2, id: 5}`
4. **Verificar permiso**: `userHasPermissionInScope(user, 'news.create', 2, 5)`
5. **Búsqueda de grants**:
   - Busca RoleGrants del usuario donde `scope_type=2 AND scope_id=5`
   - Para cada grant encontrado, verifica si el rol tiene permiso `news.create`
6. **Resultado**: `true` si encuentra al menos un grant válido, `false` si no

### Prioridad de Scopes en Contenido

Cuando un contenido tiene múltiples relaciones:
- **Prioridad 1**: association_id
- **Prioridad 2**: game_id (solo si no hay association_id)
- **Prioridad 3**: global (si no hay ninguno)

Ejemplo:
```php
// Noticia con association_id=5 y game_id=1
$scope = getScopeForContent(5, 1);
// Resultado: {type: 2, id: 5} - Se ignora game_id
```

---

## Limitaciones y Consideraciones

### 1. Sin Herencia de Permisos Globales
- Un RoleGrant global **NO** da acceso automático a scopes específicos
- Cada scope debe tener su propio grant
- Los wildcards son la forma de dar acceso a "todos" dentro de un scope_type

### 2. Wildcards vs Grants Específicos
- Wildcard: `scope_id = null` → acceso a todos los IDs
- Específico: `scope_id = 5` → acceso solo al ID 5
- **No se suman**: Si tienes wildcard, no necesitas grants específicos

### 3. Optimización de Queries
- Se usa eager loading para evitar N+1: `->with('role.permissions')`
- Los grants se cargan una vez por verificación
- Considerar caché para usuarios con muchos grants

### 4. Clave Única
La clave única `(user_id, role_id, scope_type, scope_id)` previene:
- ✅ Duplicados exactos
- ❌ **NO previene**: Mismo usuario con múltiples roles en mismo scope

Ejemplo válido (múltiples roles):
```php
// Usuario 5 puede tener ambos:
[user: 5, role: editor, scope: association:10]
[user: 5, role: moderator, scope: association:10]
```

---

## Comandos Útiles

### Seeders
```bash
# Crear roles y permisos iniciales
php artisan db:seed --class=RolePermissionSeeder

# Crear grants de ejemplo
php artisan db:seed --class=RoleGrantSeeder
```

### Tinker (Testing)
```bash
php artisan tinker

# Ver grants de un usuario
$user = User::find(1);
$user->roleGrants()->with('role')->get();

# Verificar permiso
$authService = app(\App\Services\AuthorizationService::class);
$authService->userHasPermissionInScope($user, 'news.create', 2, 5);
```

---

## Documentación Adicional

- **Sistema completo**: `docs/permissions-scope-system.md`
- **API de autorización**: `docs/api/AuthzController.md` (si existe)
- **Migraciones**: 
  - `database/migrations/2026_01_22_000000_create_role_grants_table.php`
  - `database/migrations/2026_01_27_000001_change_scope_type_to_integer_in_role_grants_table.php`

---

## Próximas Mejoras Sugeridas

1. **Caché de permisos** por usuario y scope para mejorar performance
2. **API CRUD** para gestionar RoleGrants desde el frontend
3. **Auditoría** de cambios de permisos con registro de quién asignó/quitó grants
4. **Más policies** para otros modelos (Tournament, Association, User)
5. **Herencia de permisos** global → específico (opcional, evaluando casos de uso)
6. **UI de gestión** de roles y grants en panel de administración

---

Última actualización: 7 de febrero de 2026
