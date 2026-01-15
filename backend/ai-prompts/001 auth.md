Estamos en Laravel 11 API-only con SQLite. Quiero implementar autenticación para SPA Angular usando Laravel Sanctum en modo cookie (stateful). El login debe ser por username (no email).

Tareas:
1) Instala y configura Sanctum SPA correctamente para Laravel 11:
   - Asegura middleware EnsureFrontendRequestsAreStateful en bootstrap/app.php para API.
   - Configura CORS (config/cors.php) para permitir http://localhost:4200, credenciales, y rutas api/* y sanctum/csrf-cookie.
   - Configura stateful domains en config/sanctum.php si aplica y SESSION_DOMAIN si hace falta.
2) Crea AuthController en app/Http/Controllers/Auth/AuthController.php con endpoints:
   - POST /api/auth/login: recibe {username, password}. Valida con FormRequest. Usa Auth::attempt(['username'=>..., 'password'=>...]) y retorna JSON con user.
   - POST /api/auth/logout: Auth::guard('web')->logout(); invalidate session si aplica; retorna 204 o JSON.
   - GET /api/auth/me: devuelve usuario autenticado.
3) Crea FormRequest LoginRequest con reglas: username required string, password required string.
4) Actualiza routes/api.php para registrar rutas bajo prefix auth.
5) Asegura que User model tenga campo username (si show me dónde se define en migración users) y que sea unique.
6) Añade respuestas JSON consistentes (422 para validación, 401 para credenciales incorrectas).
7) Incluye comandos artisan necesarios y deja todo compilando.
Criterio: php artisan route:list muestra auth/login, auth/logout, auth/me. Probable flujo SPA: primero GET /sanctum/csrf-cookie, luego POST /api/auth/login con withCredentials=true.
