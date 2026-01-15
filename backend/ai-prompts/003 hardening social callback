En Laravel 11 API-only, SocialAuthController callback redirige a FRONTEND_URL/auth/callback. Quiero endurecer seguridad:
- Validar FRONTEND_URL contra una lista permitida (env ALLOWED_FRONTEND_URLS separado por comas) o usar solo FRONTEND_URL fijo.
- Manejar errores del provider (denied, invalid state, exceptions) y redirigir con ok=0&error=...
- Añadir un estado/nonce para evitar CSRF en OAuth incluso usando stateless: generar un valor en session antes de redirect y validarlo al volver (o explicar por qué no aplica y proponer alternativa).
- Mantener Auth::login + session()->regenerate().
Implementa cambios sin Blade. Añade tests básicos si hay infraestructura.
