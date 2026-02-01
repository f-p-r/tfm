Laravel 11 API-only + SQLite. Implementar API de Pages (contenido editable por segmentos guardado como JSON) + endpoints públicos para leer páginas publicadas. Frontend Angular ya tiene UI admin (mocks).

DECISIONES / REGLAS:
- ownerType en API SIEMPRE string. Ejemplos: "2" (association), "3" (game). En el futuro: "news", "event", etc.
- En BD, pages.owner_type se guarda como string tal cual.
- Validación: usar 422 (FormRequest) para errores de params/body, coherente con el resto.
- Endpoints admin protegidos con auth:sanctum. (Sin controles finos de autorización todavía; solo login.)
- published/published_at:
  - si published pasa a true y published_at es null => set published_at = now()
  - si published pasa a false => NO limpiar published_at (mantener histórico).
- Slug único dentro del owner: unique(owner_type, owner_id, slug).
- Content: guardar JSON completo con validación mínima: content.schemaVersion (int) y content.segments (array). No validar exhaustivamente segmentos.
- Owners existentes:
  - games table tiene homePageId (o home_page_id) ya existente
  - associations table tiene homePageId (o home_page_id) ya existente
- DELETE Page: permitido. Si la página borrada era la home del owner:
  - si ownerType es "2" o "3": poner homePageId del owner a null.
  - para otros ownerType futuros: no hay homePageId, así que no hacer nada extra.
- Endpoints públicos:
  - NO requieren auth.
  - SOLO devuelven páginas published=true.
  - Si no existe / no publicada / no hay home => 404.

MODELO: pages
Campos mínimos:
- id (PK)
- owner_type (string, required)
- owner_id (unsigned bigint, required)
- slug (string, required)
- title (string, required)
- published (boolean, default false)
- published_at (nullable datetime)
- content (JSON; usar JSON column si SQLite lo permite, si no TEXT/LONGTEXT con JSON)
- created_at, updated_at
- Índice único: (owner_type, owner_id, slug)
Casts:
- Page::content cast a array/json
- published cast boolean

ENDPOINTS ADMIN (auth:sanctum) - base /api/admin
1) Listar páginas por owner:
GET /api/admin/pages?ownerType=...&ownerId=...
Response 200:
[
  { "id": 1, "slug": "inicio", "title": "Inicio", "published": true, "updatedAt": "...", "publishedAt": "..." },
  ...
]
- Orden: updated_at desc o id desc (elige uno y documenta; preferible updated_at desc).

2) Obtener page por id:
GET /api/admin/pages/{id}
Response 200 con todos los campos (incluyendo content).

3) Crear page:
POST /api/admin/pages
Body:
{
  "ownerType": "2",
  "ownerId": 15,
  "slug": "inicio",
  "title": "Inicio",
  "published": false,
  "content": { "schemaVersion": 1, "segments": [] }
}
Validación mínima:
- ownerType required string
- ownerId required int
- slug required string
- title required string
- published required boolean
- content required object/array
- content.schemaVersion == 1
- content.segments is array
- unique (ownerType, ownerId, slug)
Aplicar regla published_at si published=true.

4) Actualizar page:
PATCH /api/admin/pages/{id}
Body parcial permitido:
- slug, title, published, publishedAt, content
Reglas:
- aplicar unicidad de slug por owner si se cambia slug
- aplicar regla published_at al cambiar published
- permitir publishedAt solo si viene explícito (pero si published=true y published_at null, set now()).

5) Eliminar page:
DELETE /api/admin/pages/{id}
- Si era home del owner y ownerType in ("2","3") => limpiar homePageId del owner (null).
- Responder 204.

HOME PAGE EN OWNERS (auth:sanctum) - base /api/admin
6) Obtener homePageId del owner:
GET /api/admin/owners/home-page?ownerType=...&ownerId=...
Response 200:
{ "homePageId": 123 }  // puede ser null

7) Establecer homePageId del owner:
PUT /api/admin/owners/home-page
Body:
{ "ownerType": "2", "ownerId": 15, "homePageId": 123 }  // homePageId puede ser null para limpiar
Validaciones:
- ownerType required string
- ownerId required int
- homePageId nullable int
- si homePageId != null:
  - la Page debe existir y pertenecer a ese owner (owner_type + owner_id)
Acción:
- ownerType "2" actualiza associations.homePageId (o home_page_id)
- ownerType "3" actualiza games.homePageId (o home_page_id)
- para otros ownerType: devolver 422 (no soportado aún) o 501 (elige uno; preferible 422 por validación/unsupported).

ENDPOINTS PÚBLICOS - base /api
8) Obtener home page publicada por owner:
GET /api/pages/home?ownerType=...&ownerSlug=...
- Resolver ownerSlug -> ownerId según ownerType:
  - "2": buscar Association por slug
  - "3": buscar Game por slug
  - otros: 501 o 404 (dejar TODO)
- Leer homePageId del owner, cargar Page.
- Devolver Page SOLO si published=true; si no, 404.
Response 200: Page completa (id, ownerType, ownerId, slug, title, publishedAt, content, updatedAt).

9) Obtener page publicada por owner y pageSlug:
GET /api/pages/by-owner-slug?ownerType=...&ownerSlug=...&pageSlug=...
- Resolver ownerSlug -> ownerId (association/game)
- Buscar Page por (owner_type, owner_id, slug=pageSlug)
- Devolver SOLO si published=true; si no, 404.
Response 200: Page completa.

IMPLEMENTACIÓN:
- Crear Model Page (app/Models/Page.php) con casts y fillable.
- Crear migración create_pages_table con unique index.
- Crear controllers:
  - AdminPagesController (indexByOwner, show, store, update, destroy)
  - AdminOwnerHomePageController (get, set)
  - PublicPagesController (home, byOwnerSlug)
- Crear FormRequests:
  - AdminPageIndexRequest (ownerType, ownerId)
  - StorePageRequest, UpdatePageRequest
  - OwnerHomePageGetRequest, OwnerHomePageSetRequest
  - PublicHomePageRequest, PublicByOwnerSlugRequest
- Registrar rutas:
  - /api/admin/... bajo middleware auth:sanctum
  - /api/pages/... públicas sin auth
- Usar 422 en validación; 404 cuando no exista.
- Documentar TODOs claros para ownerType futuros ("news","event",...).

Criterios:
- php artisan route:list muestra todos los endpoints
- Migraciones ok
- CRUD admin funciona
- Endpoints públicos devuelven solo published y 404 en el resto
