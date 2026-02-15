# API de Gestión de Información de Contacto

## Resumen
Sistema para gestionar información de contacto (emails, teléfonos, redes sociales) para Naipeando (global), asociaciones y juegos. Cada entidad puede tener múltiples canales de contacto organizados por categorías y tipos.

---

## Modelo de Datos

### Tabla: `contact_info`

```sql
CREATE TABLE contact_info (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    
    -- Ownership: Global (1), Association (2), Game (3)
    owner_type TINYINT UNSIGNED NOT NULL,
    owner_id BIGINT UNSIGNED NULL,
    
    -- Tipo de contacto
    contact_type VARCHAR(50) NOT NULL,
    -- Valores: 'email', 'phone', 'whatsapp', 'facebook', 'instagram', 
    --          'twitter', 'discord', 'telegram', 'youtube', 'twitch', 
    --          'linkedin', 'tiktok', 'web', 'address'
    
    -- Valor del contacto (email, número, URL, handle, dirección)
    value VARCHAR(512) NOT NULL,
    
    -- Categoría para emails/whatsapp (NULL para redes sociales)
    category VARCHAR(50) NULL,
    -- Valores: 'general', 'support', 'membership', 'events', 'press', 'admin', 'other'
    
    -- Etiqueta/descripción personalizada (opcional)
    label VARCHAR(255) NULL,
    
    -- Orden de visualización
    `order` INT UNSIGNED NOT NULL DEFAULT 0,
    
    -- Visibilidad
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    
    created_at TIMESTAMP NULL DEFAULT NULL,
    updated_at TIMESTAMP NULL DEFAULT NULL,
    
    -- Índices
    INDEX idx_owner (owner_type, owner_id),
    INDEX idx_type (contact_type),
    INDEX idx_category (category),
    
    -- Foreign keys
    FOREIGN KEY (owner_id) REFERENCES associations(id) ON DELETE CASCADE WHEN owner_type = 2,
    FOREIGN KEY (owner_id) REFERENCES games(id) ON DELETE CASCADE WHEN owner_type = 3
);
```

**Notas:**
- `owner_type` + `owner_id` identifican al propietario:
  - `owner_type=1, owner_id=NULL` → Naipeando (global)
  - `owner_type=2, owner_id=5` → Asociación con ID 5
  - `owner_type=3, owner_id=3` → Juego con ID 3
- `category` solo se usa para `contact_type` IN ('email', 'whatsapp', 'phone')
- `order` define el orden de visualización dentro de cada grupo

---

## Validaciones

### Límites por tipo de contacto

```php
// Límites máximos por owner
'phone' => 2,          // Máximo 2 teléfonos
'email' => -1,         // Ilimitado (pero requiere category)
'whatsapp' => -1,      // Ilimitado (pero requiere category)
'facebook' => 1,       // Solo 1
'instagram' => 1,      // Solo 1
'twitter' => 1,        // Solo 1
'discord' => 1,        // Solo 1
'telegram' => 1,       // Solo 1
'youtube' => 1,        // Solo 1
'twitch' => 1,        // Solo 1
'linkedin' => 1,       // Solo 1
'tiktok' => 1,        // Solo 1
'web' => 2,           // Máximo 2 (web oficial + tienda, por ejemplo)
'address' => 1,       // Solo 1 dirección física
```

### Reglas de validación

**POST /api/contact-info**
```php
[
    'owner_type' => 'required|integer|in:1,2,3',
    'owner_id' => 'nullable|integer|exists_based_on_owner_type',
    'contact_type' => 'required|string|in:email,phone,whatsapp,facebook,instagram,twitter,discord,telegram,youtube,twitch,linkedin,tiktok,web,address',
    'value' => 'required|string|max:512',
    'category' => 'nullable|string|in:general,support,membership,events,press,admin,other',
    'label' => 'nullable|string|max:255',
    'order' => 'integer|min:0',
    'is_public' => 'boolean',
]
```

**Validaciones adicionales:**
1. Si `owner_type=2`, `owner_id` debe existir en `associations`
2. Si `owner_type=3`, `owner_id` debe existir en `games`
3. Si `contact_type` IN ('email', 'whatsapp', 'phone'), `category` es obligatorio
4. Si `contact_type` NOT IN ('email', 'whatsapp', 'phone'), `category` debe ser NULL
5. Validar límites: no permitir crear más del límite definido para ese `contact_type` + owner
6. Validar formato según tipo:
   - `email`: formato email válido
   - `phone`: formato internacional recomendado (E.164)
   - `whatsapp`: formato internacional (números, símbolos + permitidos)
   - Redes sociales: URL válida o handle (@username)

**Ejemplo validación límite:**
```php
// Al crear un nuevo contacto tipo 'facebook'
$existingCount = ContactInfo::where('owner_type', $request->owner_type)
    ->where('owner_id', $request->owner_id)
    ->where('contact_type', 'facebook')
    ->count();

if ($existingCount >= 1) {
    return response()->json([
        'errors' => true,
        'errorsList' => [
            'contact_type' => 'Ya existe un contacto de tipo Facebook para esta entidad'
        ]
    ], 422);
}
```

---

## Endpoints API

### GET /api/contact-info

Listar información de contacto con filtros.

**Autenticación:** No requerida (solo devuelve `is_public=true` si no autenticado)

**Query Parameters:**
- `owner_type` (integer, opcional) - Filtrar por tipo de propietario (1, 2, 3)
- `owner_id` (integer, opcional) - Filtrar por ID del propietario
- `contact_type` (string, opcional) - Filtrar por tipo de contacto
- `category` (string, opcional) - Filtrar por categoría
- `include_private` (boolean, opcional) - Incluir contactos privados (requiere autenticación y permisos)

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
    "label": null,
    "order": 10,
    "is_public": true,
    "created_at": "2026-02-15T10:00:00.000000Z",
    "updated_at": "2026-02-15T10:00:00.000000Z"
  }
]
```

**Notas:**
- Por defecto solo devuelve contactos con `is_public=true`
- Ordenados por `order` ASC

---

### GET /api/contact-info/{id}

Obtener un contacto específico.

**Autenticación:** No requerida (si es público)

**Respuesta 200 OK:** Objeto individual del mismo formato que el array de GET

**Respuesta 404:** Contacto no encontrado o no público

---

### POST /api/contact-info

Crear nuevo contacto.

**Autenticación:** Requerida (Sanctum)

**Permisos:**
- `owner_type=1`: Requiere permiso global `admin`
- `owner_type=2`: Requiere permiso `admin` en scope de asociación
- `owner_type=3`: Requiere permiso `admin` en scope de juego

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

**Respuesta 201 Created:** Objeto creado

**Respuesta 422 Unprocessable Entity:**
```json
{
  "message": "The value field must be a valid email address. (and 1 more error)",
  "errors": {
    "value": ["El formato del email no es válido"],
    "contact_type": ["Ya existe un contacto de tipo Facebook para esta entidad"]
  }
}
```

O formato alternativo:
```json
{
  "errors": true,
  "errorsList": {
    "value": "El formato del email no es válido",
    "contact_type": "Ya existe un contacto de tipo Facebook para esta entidad"
  }
}
```

---

### PUT/PATCH /api/contact-info/{id}

Actualizar contacto existente.

**Autenticación:** Requerida (Sanctum)

**Permisos:** Igual que POST

**Request Body:** Todos los campos opcionales (misma estructura que POST)

**Validaciones:**
- Validar límites excluyendo el registro actual
- No permitir cambiar `owner_type` / `owner_id` (se debe eliminar y crear nuevo)

**Respuesta 200 OK:** Objeto actualizado

**Respuesta 404 / 422:** Igual que POST

---

### DELETE /api/contact-info/{id}

Eliminar contacto.

**Autenticación:** Requerida (Sanctum)

**Permisos:** Igual que POST

**Respuesta 204 No Content:** Eliminado exitosamente

**Respuesta 404:** Contacto no encontrado

---

## Relaciones Laravel

```php
// Model: ContactInfo.php
class ContactInfo extends Model
{
    protected $table = 'contact_info';
    
    protected $fillable = [
        'owner_type', 'owner_id', 'contact_type', 'value',
        'category', 'label', 'order', 'is_public'
    ];
    
    protected $casts = [
        'owner_type' => 'integer',
        'owner_id' => 'integer',
        'order' => 'integer',
        'is_public' => 'boolean',
    ];
    
    // Relación polimórfica manual (owner_type + owner_id)
    public function owner()
    {
        if ($this->owner_type === 1) {
            return null; // Global
        } elseif ($this->owner_type === 2) {
            return $this->belongsTo(Association::class, 'owner_id');
        } elseif ($this->owner_type === 3) {
            return $this->belongsTo(Game::class, 'owner_id');
        }
    }
}

// En Association.php
public function contactInfo()
{
    return $this->hasMany(ContactInfo::class, 'owner_id')
        ->where('owner_type', 2);
}

// En Game.php
public function contactInfo()
{
    return $this->hasMany(ContactInfo::class, 'owner_id')
        ->where('owner_type', 3);
}
```

---

## Casos de Uso

### Ejemplo 1: Asociación con múltiples departamentos
```
Asociación ID 5 tiene:
- Email soporte: soporte@club.com (category: support)
- WhatsApp soporte: +34555555555 (category: support)
- Email eventos: eventos@club.com (category: events)
- Email general: info@club.com (category: general)
- Teléfono: +34912345678
- Facebook: https://facebook.com/club
- Instagram: https://instagram.com/club
```

### Ejemplo 2: Asociación simple
```
Asociación ID 8 tiene:
- Email único: contacto@asociacion.com (category: general)
- Facebook: https://facebook.com/asociacion
```

### Ejemplo 3: Naipeando (Global)
```
owner_type=1, owner_id=NULL
- Email soporte: soporte@naipeando.com (category: support)
- Email prensa: prensa@naipeando.com (category: press)
- Twitter: https://twitter.com/naipeando
- Discord: https://discord.gg/naipeando
```

---

## Notas Adicionales

1. **Orden por defecto**: Sugerido usar estos rangos para `order`:
   - Correos/WhatsApp: 0-99 (por categoría)
   - Teléfonos: 100-199
   - Redes sociales: 200-299
   - Otros: 300+

2. **Migraciones**: Incluir seeder con datos de Naipeando global básicos

3. **Soft Deletes**: Opcional, considerar si se quiere historial

4. **Cache**: Considerar cachear la lista de contactos por owner (se consulta en cada vista de asociación)
