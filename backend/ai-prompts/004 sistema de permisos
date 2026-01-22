Laravel 11 API-only + SQLite + Spatie laravel-permission ya instalado. Necesito implementar autorizaciones con "scope" (global, association, game) porque los roles se asignan por ámbito.
todos los comentarios han de ir en español

Requisitos funcionales:
- Roles/permisos se gestionan con Spatie (roles tienen permisos).
- Además, un usuario puede tener un rol asignado globalmente o dentro de una asociación concreta o dentro de un juego concreto.
- Si un contenido pertenece a una asociación (tiene association_id), los permisos a evaluar son los de esa asociación, ignorando game_id aunque exista.
- Si no hay asociación pero hay game_id, se evalúa por juego.
- Si no hay ninguno, se evalúa global.
- Un grant global debe dar acceso en cualquier scope (admin global, etc.).
- Moderador incluye editor simplemente asignándole los permisos de editor (no herencia especial).

Implementación solicitada:
1) Crear migración y modelo RoleGrant:
   - table role_grants: id, user_id (FK users), role_id (FK roles), scope_type string (global|association|game), scope_id nullable integer, timestamps
   - unique index (user_id, role_id, scope_type, scope_id)
2) Añadir relaciones en User:
   - roleGrants() hasMany RoleGrant
3) Crear un servicio/helper tipo AuthorizationService (o ScopePermissionService) con métodos:
   - userHasPermissionInScope(User $user, string $permission, string $scopeType, ?int $scopeId): bool
   - Debe devolver true si el usuario tiene algún RoleGrant global cuyo role tenga ese permiso, o si tiene RoleGrant en el scope exacto cuyo role tenga ese permiso.
   - Debe consultar los permisos del rol usando Spatie (role->hasPermissionTo()) y hacerlo eficiente (cargar roles y permissions evitando N+1).
4) Crear Policies para News y Tournament (o un ejemplo base) usando este servicio:
   - NewsPolicy: create/update/publish (usa scope de News: si association_id => association scope, else if game_id => game scope, else global)
   - Si no existe news model policy aún, crea lo mínimo para demostrar.
5) Registrar policies en AuthServiceProvider SOLO si hace falta en Laravel 11 (si no existe providers, usa el mecanismo actual de Laravel 11 para policies o documenta dónde registrarlo).
6) Añadir seeds iniciales:
   - Roles: admin, moderator, editor
   - Permisos: news.create, news.update, news.publish (y los que creas necesarios de ejemplo)
   - Asignar permisos de editor a editor; moderator = editor + alguno extra opcional; admin = todos.
7) Añadir un ejemplo rápido de cómo asignar RoleGrant a un usuario (tinker snippet o seeder):
   - user 1: admin global
   - user 2: editor en association 15
Criterio de aceptación:
- migrate funciona
- seeder crea roles/permisos
- el servicio responde correctamente para global override y scope exacto
