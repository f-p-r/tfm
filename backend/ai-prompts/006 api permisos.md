Laravel 11 API-only + SQLite. Auth con Sanctum (cookie stateful) ya funcionando. Spatie laravel-permission instalado. Existe tabla role_grants (user_id, role_id, scope_type, scope_id nullable) y AuthorizationService ya implementado (sin global override: permisos en scopeType=global NO conceden automáticamente association/game). Queremos exponer un endpoint único para que el frontend consulte permisos efectivos por scopeType y scopeIds.

IMPORTANTE:
- scopeType es NUMÉRICO en API (no strings).
- permissions son STRINGS (ej "news.create"), y en respuestas se devuelven ORDENADAS alfabéticamente.
- Wildcard: role_grants con scope_id = null significa “todos los ids” para ese scopeType.
- Semántica de listas vacías:
  - scopeIds=[] => “todos los scopeIds que tenga el usuario en ese scopeType”
  - permissions=[] => “cualquier permiso”
- En filtros, si se pasan varios permissions, la condición es OR (alguno).
- No hay paginación; devolver todos los coincidentes.
- Requiere login: middleware auth:sanctum.

SCOPE TYPE IDS:
Define constantes/enum en backend (PHP 8.2+) para mapear:
- GLOBAL = 1
- ASSOCIATION = 2
- GAME = 3
(Usar estos valores en validación y respuesta. Internamente role_grants puede seguir usando string o int según esté ya; si está en string, mapear al vuelo.)

ENDPOINT:
Implementar POST /api/authz/query (usar POST porque hay arrays).
Request JSON:
{
  "scopeType": number,          // obligatorio (1|2|3)
  "scopeIds": number[],         // obligatorio, puede ser []
  "permissions": string[],      // obligatorio, puede ser []
  "breakdown": boolean          // obligatorio
}

Respuesta:
A) breakdown=false:
{
  "scopeType": number,
  "all": boolean,               // true si existe wildcard (scopeId=null) para ese scopeType con algún permiso relevante
  "scopeIds": number[]          // scopeIds donde el usuario tiene AL MENOS UNO de los permissions solicitados (OR). Si permissions=[] => cualquier permiso. Si all=true normalmente devolver [].
}

B) breakdown=true:
{
  "scopeType": number,
  "all": boolean,
  "allPermissions": string[],   // permisos concedidos por wildcard (scopeId=null) en ese scopeType. Ordenados alfabéticamente.
  "results": [
    { "scopeId": number, "permissions": string[] } // permisos concedidos específicamente en ese scopeId. Ordenados.
  ]
}

REGLAS DE CÁLCULO (sin global override):
- Solo se evalúan grants cuyo scope_type corresponda EXACTAMENTE al scopeType consultado.
- (scopeType=global) NO concede nada a association/game.
- Wildcard: grants con scope_id=null aplican a “all=true” y sus permisos van en allPermissions.
- Para breakdown=true:
  - Si permissions=[] => devolver TODOS los permisos concedidos en wildcard + por scopeId.
  - Si permissions no vacío => devolver SOLO los permisos concedidos que estén en esa lista (filtro).
  - results solo debe incluir scopeIds donde haya al menos 1 permiso concedido (tras filtro), excepto si scopeIds fue proporcionado explícitamente y quieres devolver scopeIds consultados aunque no tengan permisos (preferible NO: devolver solo los que tengan permisos).
- Para breakdown=false:
  - Si permissions=[] => devolver scopeIds donde el usuario tenga AL MENOS 1 permiso (cualquiera) en ese scopeType.
  - Si permissions no vacío => devolver scopeIds donde tenga AL MENOS 1 de los permisos solicitados (OR).
  - Si scopeIds=[] => considerar todos los scopeIds que el usuario tenga grants explícitos (scope_id no null) para ese scopeType. Si además hay wildcard, marcar all=true.

IMPLEMENTACIÓN SUGERIDA:
1) Crear enum ScopeType (int) en app/Enums/ScopeType.php con valores 1/2/3.
2) Crear FormRequest AuthzQueryRequest:
   - valida scopeType in [1,2,3]
   - scopeIds array (ints, >=1) (puede ser empty)
   - permissions array of strings (puede ser empty)
   - breakdown boolean
3) Crear controller AuthzController con método query(AuthzQueryRequest $request).
4) Implementar en un servicio (p.ej. AuthzService) lógica para obtener permisos concedidos:
   - Obtener RoleGrants del user para ese scopeType (incluyendo wildcard y específicos).
   - Para cada RoleGrant, obtener el Role (Spatie) y sus permisos.
   - Unir permisos por (wildcard) y por scopeId.
   - Eficiencia: evitar N+1 cargando roles y permissions (eager load / join) o cache per-request.
5) Registrar ruta en routes/api.php:
   Route::middleware('auth:sanctum')->post('/authz/query', [AuthzController::class, 'query']);
6) Devolver JSON exactamente con el formato indicado.
7) Ordenar alfabéticamente arrays de permisos en respuesta.
8) Añadir tests feature si hay infraestructura:
   - scopeIds=[], permissions=[]
   - wildcard existente => all=true + allPermissions
   - filtro permissions OR
   - breakdown false vs true

Nota: Si role_grants.scope_type está almacenado como string actualmente (global/association/game), mapear entre int<->string en un único sitio (enum helper) y mantener coherencia.
