# SocialAuthController API

Controlador de autenticación mediante proveedores sociales (OAuth).

## Proveedores Soportados
- `google`
- `facebook`

## Endpoints

### GET /api/auth/{provider}/redirect
Iniciar el flujo OAuth redirigiendo al proveedor social.

**Autenticación:** No requerida

**Parámetros de ruta:**
- `provider` (string) - Nombre del proveedor: `google` | `facebook`

**Respuestas:**
- **302 Redirect** - Redirección al proveedor OAuth
- **422 Unprocessable Entity** - Proveedor no soportado
  ```json
  {
    "message": "Provider not supported"
  }
  ```

---

### GET /api/auth/{provider}/callback
Callback OAuth que procesa la respuesta del proveedor y autentica/crea el usuario.

**Autenticación:** No requerida

**Parámetros de ruta:**
- `provider` (string) - Nombre del proveedor: `google` | `facebook`

**Query Parameters (gestionados por el proveedor):**
- `code` - Código de autorización
- `state` - Token de estado para validación CSRF
- `error` - Error del proveedor (si aplica)

**Respuestas:**
- **302 Redirect** - Redirección al frontend con resultado
  - Éxito: `{frontend}/auth/callback?provider={provider}&ok=1`
  - Error: `{frontend}/auth/callback?provider={provider}&ok=0&error={error}`

**Comportamiento:**
1. Verifica el proveedor
2. Valida el estado OAuth
3. Obtiene datos del usuario del proveedor
4. Busca usuario existente por `provider_id` o `email`
5. Si no existe, crea nuevo usuario con username único
6. Autentica al usuario en la sesión
7. Redirige al frontend con resultado
