# AuthController API

Controlador de autenticación básica con usuario y contraseña.

## Endpoints

### POST /api/auth/login
Autenticar un usuario con credenciales.

**Autenticación:** No requerida

**Request Body:**
```json
{
  "username": "string (required)",
  "password": "string (required)"
}
```

**Respuestas:**
- **200 OK** - Login exitoso
  ```json
  {
    "user": {
      "id": 1,
      "name": "Usuario",
      "username": "usuario123",
      "email": "usuario@example.com",
      ...
    }
  }
  ```

- **401 Unauthorized** - Credenciales inválidas
  ```json
  {
    "message": "Invalid credentials"
  }
  ```

- **422 Unprocessable Entity** - Error de validación

---

### POST /api/auth/logout
Cerrar sesión del usuario autenticado.

**Autenticación:** Requerida (Sanctum)

**Respuestas:**
- **204 No Content** - Logout exitoso

---

### GET /api/auth/me
Obtener información del usuario autenticado.

**Autenticación:** Requerida (Sanctum)

**Respuestas:**
- **200 OK**
  ```json
  {
    "user": {
      "id": 1,
      "name": "Usuario",
      "username": "usuario123",
      "email": "usuario@example.com",
      ...
    }
  }
  ```

- **401 Unauthorized** - No autenticado
