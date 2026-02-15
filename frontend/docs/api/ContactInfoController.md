# ContactInfoController API

Controlador para gestión de información de contacto (emails, teléfonos, redes sociales) para Naipeando (global), asociaciones y juegos.

**Estado:** ✅ Implementado

---

## Modelo de Datos

Cada entidad (Naipeando, Asociación, Juego) puede tener múltiples canales de contacto organizados por categorías y tipos.

### Owner Types (Propietarios)
- `1` - Global (Naipeando)
- `2` - Asociación
- `3` - Juego

### Contact Types (Tipos de Contacto)
- `email` - Correo electrónico
- `phone` - Teléfono
- `whatsapp` - WhatsApp
- `facebook` - Facebook
- `instagram` - Instagram
- `twitter` - Twitter (X)
- `discord` - Discord
- `telegram` - Telegram
- `youtube` - YouTube
- `twitch` - Twitch
- `linkedin` - LinkedIn
- `tiktok` - TikTok
- `web` - Sitio web
- `address` - Dirección física

### Categories (Categorías)
Solo para `email`, `phone`, y `whatsapp`:

| Valor (category) | Etiqueta (category_label) |
|------------------|---------------------------|
| `general` | General |
| `support` | Soporte |
| `membership` | Membresía |
| `events` | Eventos |
| `press` | Prensa |
| `admin` | Administración |
| `other` | Otro |

**Nota:** El modelo devuelve automáticamente el campo `category_label` con la traducción en español de la categoría.

### Límites por Tipo de Contacto
- `phone`: Máximo 2
- `email`: Ilimitado (requiere category)
- `whatsapp`: Ilimitado (requiere category)
- `facebook`: Máximo 1
- `instagram`: Máximo 1
- `twitter`: Máximo 1
- `discord`: Máximo 1
- `telegram`: Máximo 1
- `youtube`: Máximo 1
- `twitch`: Máximo 1
- `linkedin`: Máximo 1
- `tiktok`: Máximo 1
- `web`: Máximo 2
- `address`: Máximo 1

---

## Autenticación y Permisos

### Endpoints Públicos
- `GET /api/contact-info` - Lista (solo muestra contactos con `is_public=true`)
- `GET /api/contact-info/{id}` - Ver contacto (si es público)

### Endpoints Protegidos
Requieren autenticación (Sanctum) y permisos específicos:
- `POST /api/contact-info` - Crear
- `PUT/PATCH /api/contact-info/{id}` - Actualizar
- `DELETE /api/contact-info/{id}` - Eliminar

**Permisos requeridos según owner_type:**
- `owner_type=1` (Global): Permiso `admin` en scope global
- `owner_type=2` (Asociación): Permiso `admin` en scope de la asociación específica
- `owner_type=3` (Juego): Permiso `admin` en scope del juego específico

---

## Endpoints

### GET /api/contact-info
Listar información de contacto con filtros.

**Autenticación:** No requerida

**Query Parameters:**
- `owner_type` (integer, opcional) - Filtrar por tipo de propietario (1, 2, 3)
- `owner_id` (integer, opcional) - Filtrar por ID del propietario
- `contact_type` (string, opcional) - Filtrar por tipo de contacto
- `category` (string, opcional) - Filtrar por categoría
- `include_private` (boolean, opcional) - Incluir contactos privados (requiere autenticación, ignorado si no está autenticado)

**Respuesta 200 OK:**
```json
[
  {
    "id": 1,
    "owner_type": 2,
    "owner_id": 5,
    "contact_type": "email",
    "value": "soporte@asociacion.com",
    "category": "support",
    "category_label": "Soporte",
    "label": "Incidencias técnicas",
    "order": 1,
    "is_public": true,
    "created_at": "2026-02-15T10:00:00.000000Z",
    "updated_at": "2026-02-15T10:00:00.000000Z"
  },
  {
    "id": 2,
    "owner_type": 2,
    "owner_id": 5,
    "contact_type": "whatsapp",
    "value": "+34666666666",
    "category": "membership",
    "category_label": "Membresía",
    "label": "Solicitud de ingreso",
    "order": 2,
    "is_public": true,
    "created_at": "2026-02-15T10:00:00.000000Z",
    "updated_at": "2026-02-15T10:00:00.000000Z"
  },
  {
    "id": 3,
    "owner_type": 2,
    "owner_id": 5,
    "contact_type": "facebook",
    "value": "https://facebook.com/asociacion",
    "category": null,
    "category_label": null,
    "label": null,
    "order": 200,
    "is_public": true,
    "created_at": "2026-02-15T10:00:00.000000Z",
    "updated_at": "2026-02-15T10:00:00.000000Z"
  }
]
```

**Notas:**
- Por defecto solo devuelve contactos con `is_public=true`
- Ordenados por `order` ASC, luego por `id` ASC
- Si `owner_type` y `owner_id` se especifican, devuelve todos los contactos de esa entidad

**Ejemplos de uso:**

```bash
# Listar todos los contactos públicos
curl -X GET "http://localhost:8000/api/contact-info"

# Contactos de una asociación específica
curl -X GET "http://localhost:8000/api/contact-info?owner_type=2&owner_id=5"

# Solo emails de Naipeando (global)
curl -X GET "http://localhost:8000/api/contact-info?owner_type=1&contact_type=email"

# Redes sociales de un juego
curl -X GET "http://localhost:8000/api/contact-info?owner_type=3&owner_id=2&contact_type=facebook"
```

---

### GET /api/contact-info/{id}
Obtener un contacto específico.

**Autenticación:** No requerida (si es público)

**Parámetros de ruta:**
- `id` (integer) - ID del contacto

**Respuesta 200 OK:**
```json
{
  "id": 1,
  "owner_type": 2,
  "owner_id": 5,
  "contact_type": "email",
  "value": "eventos@asociacion.com",
  "category": "events",
  "category_label": "Eventos",
  "label": "Organización de torneos",
  "order": 3,
  "is_public": true,
  "created_at": "2026-02-15T10:00:00.000000Z",
  "updated_at": "2026-02-15T10:00:00.000000Z"
}
```

**Respuesta 404 Not Found:**
```json
{
  "message": "Contacto no encontrado"
}
```

**Nota:** Si el contacto tiene `is_public=false` y el usuario no está autenticado, se devuelve 404.

**Ejemplo de uso:**
```bash
curl -X GET "http://localhost:8000/api/contact-info/1"
```

---

### POST /api/contact-info
Crear nuevo contacto.

**Autenticación:** Requerida (Sanctum)

**Permisos:** Según `owner_type` (ver sección de Autenticación y Permisos)

**Request Body:**
```json
{
  "owner_type": 2,
  "owner_id": 5,
  "contact_type": "email",
  "value": "eventos@asociacion.com",
  "category": "events",
  "label": "Organización de torneos",
  "order": 3,
  "is_public": true
}
```

**Campos:**
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `owner_type` | integer | Sí | Tipo de propietario: 1 (Global), 2 (Asociación), 3 (Juego) |
| `owner_id` | integer | Condicional | ID del propietario. `null` para Global, obligatorio para Asociación/Juego |
| `contact_type` | string | Sí | Tipo de contacto (ver lista de tipos válidos) |
| `value` | string | Sí | Valor del contacto (email, teléfono, URL, etc.) Max 512 caracteres |
| `category` | string | Condicional | Obligatorio para email/phone/whatsapp. Debe ser `null` para otros tipos |
| `label` | string | No | Etiqueta descriptiva personalizada. Max 255 caracteres |
| `order` | integer | No | Orden de visualización. Default: 0 |
| `is_public` | boolean | No | Visibilidad pública. Default: true |

**Validaciones:**
1. Si `owner_type=2`, `owner_id` debe existir en `associations`
2. Si `owner_type=3`, `owner_id` debe existir en `games`
3. Si `owner_type=1`, `owner_id` debe ser `null`
4. `contact_type` IN (email, phone, whatsapp, facebook, instagram, twitter, discord, telegram, youtube, twitch, linkedin, tiktok, web, address)
5. Si `contact_type` IN (email, phone, whatsapp), `category` es obligatorio
6. Si `contact_type` NOT IN (email, phone, whatsapp), `category` debe ser `null`
7. No exceder límites definidos para cada tipo de contacto
8. Validar formato según tipo:
   - `email`: formato email válido (RFC)
   - `phone`, `whatsapp`: formato internacional con números, espacios, guiones, paréntesis, símbolo +
   - Redes sociales/web: URL válida o handle (@username)

**Respuesta 201 Created:**
```json
{
  "id": 15,
  "owner_type": 2,
  "owner_id": 5,
  "contact_type": "email",
  "value": "eventos@asociacion.com",
  "category": "events",
  "category_label": "Eventos",
  "label": "Organización de torneos",
  "order": 3,
  "is_public": true,
  "created_at": "2026-02-15T12:30:00.000000Z",
  "updated_at": "2026-02-15T12:30:00.000000Z"
}
```

**Respuesta 401 Unauthorized:**
```json
{
  "message": "No autenticado"
}
```

**Respuesta 403 Forbidden:**
```json
{
  "message": "No tienes permisos para gestionar contactos de esta asociación"
}
```

**Respuesta 422 Unprocessable Entity:**
```json
{
  "message": "The value field must be a valid email address. (and 1 more error)",
  "errors": {
    "value": [
      "El formato del email no es válido."
    ],
    "contact_type": [
      "Ya existe el número máximo de contactos de tipo facebook para esta entidad (límite: 1)."
    ]
  }
}
```

**Ejemplos de uso:**

```bash
# Crear email de soporte para asociación
curl -X POST "http://localhost:8000/api/contact-info" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "owner_type": 2,
    "owner_id": 5,
    "contact_type": "email",
    "value": "soporte@club.com",
    "category": "support",
    "label": "Soporte técnico",
    "order": 10,
    "is_public": true
  }'

# Crear Facebook global
curl -X POST "http://localhost:8000/api/contact-info" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "owner_type": 1,
    "owner_id": null,
    "contact_type": "facebook",
    "value": "https://facebook.com/naipeando",
    "category": null,
    "order": 200,
    "is_public": true
  }'

# Crear WhatsApp privado para membresía
curl -X POST "http://localhost:8000/api/contact-info" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "owner_type": 2,
    "owner_id": 3,
    "contact_type": "whatsapp",
    "value": "+34666555444",
    "category": "membership",
    "label": "WhatsApp para nuevos miembros",
    "order": 50,
    "is_public": false
  }'
```

---

### PUT/PATCH /api/contact-info/{id}
Actualizar contacto existente.

**Autenticación:** Requerida (Sanctum)

**Permisos:** Igual que POST (basado en el owner del contacto)

**Parámetros de ruta:**
- `id` (integer) - ID del contacto a actualizar

**Request Body:** Todos los campos son opcionales (actualización parcial soportada)
```json
{
  "contact_type": "email",
  "value": "nuevo-email@asociacion.com",
  "category": "support",
  "label": "Soporte actualizado",
  "order": 5,
  "is_public": true
}
```

**Campos:**
Misma estructura que POST, pero todos opcionales. 

**Restricciones:**
- ❌ **NO se puede cambiar `owner_type`** (se puede enviar pero debe ser el mismo valor)
- ❌ **NO se puede cambiar `owner_id`** (se puede enviar pero debe ser el mismo valor)
- Si se cambia el `contact_type`, se validan los límites para el nuevo tipo
- El contacto actual se excluye al contar límites

**Nota:** Es seguro enviar el objeto completo incluyendo `owner_type` y `owner_id` sin modificación. La validación solo rechaza cambios en estos campos.

**Respuesta 200 OK:**
```json
{
  "id": 15,
  "owner_type": 2,
  "owner_id": 5,
  "contact_type": "email",
  "value": "nuevo-email@asociacion.com",
  "category": "support",
  "category_label": "Soporte",
  "label": "Soporte actualizado",
  "order": 5,
  "is_public": true,
  "created_at": "2026-02-15T12:30:00.000000Z",
  "updated_at": "2026-02-15T14:20:00.000000Z"
}
```

**Respuesta 401/403/422:** Igual que POST

**Respuesta 404 Not Found:**
```json
{
  "message": "Contacto no encontrado"
}
```

**Ejemplo de uso:**
```bash
# Actualizar solo el valor
curl -X PATCH "http://localhost:8000/api/contact-info/15" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "value": "nuevo-soporte@club.com"
  }'

# Cambiar orden y label
curl -X PUT "http://localhost:8000/api/contact-info/15" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "order": 100,
    "label": "Contacto principal"
  }'

# Hacer contacto privado
curl -X PATCH "http://localhost:8000/api/contact-info/15" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "is_public": false
  }'
```

---

### DELETE /api/contact-info/{id}
Eliminar contacto.

**Autenticación:** Requerida (Sanctum)

**Permisos:** Igual que POST (basado en el owner del contacto)

**Parámetros de ruta:**
- `id` (integer) - ID del contacto a eliminar

**Respuesta 204 No Content:**
Sin contenido. Eliminación exitosa.

**Respuesta 401 Unauthorized:**
```json
{
  "message": "No autenticado"
}
```

**Respuesta 403 Forbidden:**
```json
{
  "message": "No tienes permisos para gestionar contactos de este juego"
}
```

**Respuesta 404 Not Found:**
```json
{
  "message": "Contacto no encontrado"
}
```

**Ejemplo de uso:**
```bash
curl -X DELETE "http://localhost:8000/api/contact-info/15" \
  -H "Authorization: Bearer {token}"
```

---

## Casos de Uso

### Ejemplo 1: Asociación con múltiples departamentos

Una asociación grande puede tener:
```
Asociación ID 5:
- Email info: info@club.com (category: general, order: 1)
- Email soporte: soporte@club.com (category: support, order: 10)
- Email eventos: eventos@club.com (category: events, order: 20)
- WhatsApp soporte: +34555555555 (category: support, order: 50)
- WhatsApp membresía: +34555555556 (category: membership, order: 60)
- Teléfono oficina: +34912345678 (category: general, order: 100)
- Facebook: https://facebook.com/club (order: 200)
- Instagram: https://instagram.com/club (order: 210)
- Web oficial: https://www.club.com (order: 300)
```

### Ejemplo 2: Asociación simple

Una asociación pequeña puede tener:
```
Asociación ID 8:
- Email único: contacto@asociacion.com (category: general)
- Facebook: https://facebook.com/asociacion
```

### Ejemplo 3: Naipeando (Global)

```
owner_type=1, owner_id=NULL:
- Email info: info@naipeando.com (category: general, order: 1)
- Email soporte: soporte@naipeando.com (category: support, order: 10)
- Email prensa: prensa@naipeando.com (category: press, order: 20)
- Twitter: https://twitter.com/naipeando (order: 200)
- Discord: https://discord.gg/naipeando (order: 210)
```

### Ejemplo 4: Juego específico

```
Juego ID 3 (Mus):
- Email contacto: mus@naipeando.com (category: general)
- Web oficial: https://www.mus-game.com (order: 300)
```

---

## Notas Adicionales

### Campo category_label

El modelo ContactInfo incluye automáticamente el campo `category_label` en todas las respuestas JSON. Este campo contiene la traducción al español de la categoría:

| category | category_label |
|----------|----------------|
| general | General |
| support | Soporte |
| membership | Membresía |
| events | Eventos |
| press | Prensa |
| admin | Administración |
| other | Otro |

Si `category` es `null`, `category_label` también será `null`.

**Implementación:**
- Definido como accessor en el modelo: `getCategoryLabelAttribute()`
- Añadido automáticamente al array JSON mediante `$appends = ['category_label']`
- No requiere configuración adicional en el frontend

### Orden Sugerido
Para mantener consistencia, se recomienda usar estos rangos para `order`:
- **0-99**: Emails y teléfonos (por categoría)
- **100-199**: Teléfonos adicionales
- **200-299**: Redes sociales
- **300-399**: Sitios web
- **400+**: Otros (direcciones físicas, etc.)

### Relaciones en Modelos

**Association.php:**
```php
public function contactInfo()
{
    return $this->hasMany(ContactInfo::class, 'owner_id')
        ->where('owner_type', 2);
}
```

**Game.php:**
```php
public function contactInfo()
{
    return $this->hasMany(ContactInfo::class, 'owner_id')
        ->where('owner_type', 3);
}
```

**Uso:**
```php
// Obtener contactos de una asociación
$association = Association::find(5);
$contacts = $association->contactInfo()->public()->ordered()->get();

// Obtener solo emails
$emails = $association->contactInfo()
    ->where('contact_type', 'email')
    ->get();
```

### Validación de Formatos

**Email:**
- Validado con `filter_var($value, FILTER_VALIDATE_EMAIL)`
- Debe cumplir RFC 5322

**Teléfono/WhatsApp:**
- Regex: `/^\+?[0-9\s\-\(\)]+$/`
- Acepta: números, espacios, guiones, paréntesis, símbolo +
- Ejemplos válidos:
  - `+34912345678`
  - `+1 (555) 123-4567`
  - `34 666 555 444`

**Redes Sociales/Web:**
- Debe ser URL válida (con `filter_var($value, FILTER_VALIDATE_URL)`)
- O handle que empiece con `@` (ejemplo: `@naipeando`)
- Ejemplos válidos:
  - `https://facebook.com/naipeando`
  - `https://twitter.com/naipeando`
  - `@naipeando_oficial`

### Cache (Recomendación futura)

Para mejorar el rendimiento, considera cachear la lista de contactos por owner:

```php
$cacheKey = "contacts:owner_{$ownerType}_{$ownerId}";
$contacts = Cache::remember($cacheKey, 3600, function() use ($ownerType, $ownerId) {
    return ContactInfo::forOwner($ownerType, $ownerId)
        ->public()
        ->ordered()
        ->get();
});
```

Invalidar cache al crear/actualizar/eliminar contactos.

---

## Códigos de Estado HTTP

| Código | Descripción | Cuándo se usa |
|--------|-------------|---------------|
| 200 | OK | GET exitoso, UPDATE exitoso |
| 201 | Created | POST exitoso (contacto creado) |
| 204 | No Content | DELETE exitoso |
| 401 | Unauthorized | Endpoints protegidos sin token válido |
| 403 | Forbidden | Sin permisos para gestionar contactos de la entidad |
| 404 | Not Found | Contacto no encontrado o no público |
| 422 | Unprocessable Entity | Errores de validación (formato, límites, etc.) |
| 500 | Internal Server Error | Error al ejecutar operación en BD |

---

## Mensajes de Error Comunes

### Errores de Validación (422)

**Límites excedidos:**
```json
{
  "errors": {
    "contact_type": [
      "Ya existe el número máximo de contactos de tipo facebook para esta entidad (límite: 1)."
    ]
  }
}
```

**Formato inválido:**
```json
{
  "errors": {
    "value": [
      "El formato del email no es válido."
    ]
  }
}
```

**Categoría incorrecta:**
```json
{
  "errors": {
    "category": [
      "La categoría es obligatoria para este tipo de contacto."
    ]
  }
}
```

**Owner inválido:**
```json
{
  "errors": {
    "owner_id": [
      "La asociación especificada no existe."
    ]
  }
}
```

### Errores de Permisos (403)

```json
{
  "message": "No tienes permisos para gestionar contactos globales"
}
```

```json
{
  "message": "No tienes permisos para gestionar contactos de esta asociación"
}
```

```json
{
  "message": "No tienes permisos para gestionar contactos de este juego"
}
```

---

## Datos Iniciales (Seeder)

Al ejecutar `php artisan db:seed --class=ContactInfoSeeder` se crean 5 contactos globales de Naipeando:

1. **info@naipeando.com** (general, order: 1)
2. **soporte@naipeando.com** (support, order: 10)
3. **prensa@naipeando.com** (press, order: 20)
4. **Twitter**: https://twitter.com/naipeando (order: 200)
5. **Discord**: https://discord.gg/naipeando (order: 210)

Todos con `is_public=true`.
