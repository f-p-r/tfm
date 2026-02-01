Laravel 11 API-only + SQLite. Ya existe auth con Sanctum (cookie). Implementar un endpoint para resolver enlaces internos a partir de type+slug.

Contexto:
Frontend (Angular) guarda enlaces internos en HTML de Quill usando anchors con:
- data-internal-type (string o number)
- data-internal-id (number)
Para permitir pegar una URL (relativa o absoluta) y convertirla a un enlace interno, el frontend necesita resolver:
type + slug -> id (+ title)

Entidades existentes hoy en backend:
- Asociaciones
- Juegos
Futuros (aún no existen): news, event, page

Tipos actuales:
- type=2 => ASSOCIATION (scopeType numérico en frontend)
- type=3 => GAME (scopeType numérico en frontend)
Tipos futuros serán strings: "news", "event", "page"

Endpoint requerido:
GET /api/internal-links/resolve
- Requiere auth:sanctum
- Query params:
  - type (required): 2 | 3 | "news" | "event" | "page"
  - slug (required): string
  - (futuro para pages): ownerType, ownerSlug (ver abajo)
- Normalizar slug: trim + lowercase.

Respuestas:
200 OK:
{
  "type": <same as received or normalized>,
  "id": <number>,
  "slug": "<normalized slug>",
  "title": "<string optional but recommended>"
}

Errores (coherencia con el proyecto: usar 422 para validación):
- 422 si faltan params o type inválido:
  { "error": "invalid_request", "message": "type and slug are required" }
  (o un formato consistente con el resto del backend, pero status debe ser 422)
- 404 si no existe:
  { "error": "not_found", "message": "No entity found for given type and slug" }

Implementación actual (solo asociaciones y juegos):
- Si type == 2:
  - buscar Association por slug (único global)
  - devolver id y title=name
- Si type == 3:
  - buscar Game por slug (único global)
  - devolver id y title=name

Preparación para futuro:
- Estructurar el controlador con switch/case dejando TODOs claros para:
  - type="news": buscar News por slug (único global) (no implementar si no existe modelo)
  - type="event": buscar Event por slug (único global) (no implementar si no existe modelo)
  - type="page": slug no es global; requerirá ampliar contrato:
    Opción A prevista (no implementar, solo dejar TODO):
      /api/internal-links/resolve?type=page&ownerType=2|3&ownerSlug=...&slug=...
      resolver ownerSlug -> ownerId, luego (ownerType, ownerId, pageSlug)->pageId

Entregables:
- Ruta en routes/api.php bajo middleware auth:sanctum.
- Controller InternalLinksController (o similar) con método resolve(Request).
- Validación (FormRequest opcional) para type+slug, status 422 en invalid request.
- Implementación funcional para type 2 y 3.
- Respuestas JSON coherentes.

Notas:
- type debe devolverse tal cual se recibió o normalizado (por ejemplo, numérico 2/3 o string "news"...).
- El endpoint debe ser barato; se puede añadir cache HTTP corta opcional (no imprescindible).
