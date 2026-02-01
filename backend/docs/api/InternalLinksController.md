# InternalLinksController API Documentation

## Overview
The InternalLinksController provides an endpoint to resolve internal links based on their type and slug. This is useful for resolving relative or absolute URLs to internal entities and obtaining their ID and title.

## Base URL
`/api/internal-links`

## Authentication
All endpoints require authentication via Sanctum (cookie-based).

---

## Endpoints

### 1. Resolve Internal Link

**Endpoint:** `GET /api/internal-links/resolve`

**Description:** Resolves a slug and type to an internal entity, returning its ID, slug, and title.

**Query Parameters:**
- `type` (required): The type of entity to resolve. Possible values:
  - `2`: Association
  - `3`: Game
  - `news`: News article (not yet implemented)
  - `event`: Event (not yet implemented)
  - `page`: Page (not yet implemented)
- `slug` (required): The slug of the entity (case-insensitive, will be normalized)

**Request Example:**
```http
GET /api/internal-links/resolve?type=2&slug=real-madrid
Authorization: Cookie (session)
```

**Success Response (200):**
```json
{
    "type": "2",
    "id": 1,
    "slug": "real-madrid",
    "title": "Real Madrid CF"
}
```

**Validation Error Response (422):**
```json
{
    "errors": {
        "type": ["The type field is required."],
        "slug": ["The slug field is required."]
    }
}
```

Or for invalid type:
```json
{
    "errors": {
        "type": ["The selected type is invalid."]
    }
}
```

**Not Found Response (404):**
```json
{
    "error": "Entity not found"
}
```

**Not Implemented Response (501):**
```json
{
    "error": "Type 'news' not implemented yet"
}
```

---

## Entity Type Mapping

| Type Value | Entity | Status |
|------------|--------|--------|
| `2` | Association | ✅ Implemented |
| `3` | Game | ✅ Implemented |
| `news` | News Article | ⏳ Not implemented |
| `event` | Event | ⏳ Not implemented |
| `page` | Page | ⏳ Not implemented |

---

## Slug Normalization

All slugs are automatically normalized before lookup:
- Trimmed of whitespace
- Converted to lowercase

This ensures case-insensitive matching.

---

## Error Codes

| HTTP Code | Description |
|-----------|-------------|
| 200 | Success - Entity found and resolved |
| 401 | Unauthorized - Not authenticated |
| 422 | Validation Error - Missing or invalid parameters |
| 404 | Not Found - Entity does not exist |
| 501 | Not Implemented - Entity type not yet supported |

---

## Usage Notes

1. **Authentication Required**: All requests must include valid Sanctum session cookies
2. **Case Insensitive**: Slugs are matched case-insensitively
3. **Future Types**: Types `news`, `event`, and `page` will return 501 until implemented
4. **Title Field**: 
   - For Associations: Returns the `name` field
   - For Games: Returns the `name` field
   - Future types will map to their respective title/name fields

---

## Implementation Details

### Association Resolution (type=2)
- Looks up by `slug` in the `associations` table
- Returns `name` as title
- Requires exact slug match (after normalization)

### Game Resolution (type=3)
- Looks up by `slug` in the `games` table
- Returns `name` as title
- Requires exact slug match (after normalization)

### Future Types
The following types are planned for future implementation:
- `news`: Will query the `news` table
- `event`: Will query a future `events` table
- `page`: Will query a future `pages` table

---

## Example Workflows

### Resolving an Association Link
```bash
curl -X GET "http://localhost:8000/api/internal-links/resolve?type=2&slug=real-madrid" \
     -H "Cookie: laravel_session=..." \
     -H "X-XSRF-TOKEN: ..."
```

### Resolving a Game Link
```bash
curl -X GET "http://localhost:8000/api/internal-links/resolve?type=3&slug=chess" \
     -H "Cookie: laravel_session=..." \
     -H "X-XSRF-TOKEN: ..."
```

### Handling Not Implemented Types
```bash
curl -X GET "http://localhost:8000/api/internal-links/resolve?type=news&slug=latest-tournament" \
     -H "Cookie: laravel_session=..." \
     -H "X-XSRF-TOKEN: ..."

# Response: 501 Not Implemented
{
    "error": "Type 'news' not implemented yet"
}
```
