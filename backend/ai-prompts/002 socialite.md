Proyecto Laravel 11 API-only + Sanctum SPA cookie. Quiero social login con Google y Facebook (extensible a otros) usando Laravel Socialite.

Tareas:
1) Instala Socialite y configura services.php para google y facebook (client_id, client_secret, redirect).
2) Crea SocialAuthController en app/Http/Controllers/Auth/SocialAuthController.php con:
   - GET /api/auth/{provider}/redirect: valida provider permitido (google, facebook). Usa Socialite::driver($provider)->stateless()->redirect().
   - GET /api/auth/{provider}/callback: obtiene user del provider, crea o actualiza usuario local:
       - buscar por provider + provider_id OR por email si viene y emparejar.
       - guardar provider, provider_id, avatar, name/email si procede.
     Luego autentica al usuario (Auth::login($user)) para que Sanctum cookie quede activa.
     Redirige a FRONTEND_URL.'/auth/callback?provider=...&ok=1' (usa env FRONTEND_URL).
3) Añade migración a users para soportar social login:
   - provider nullable string
   - provider_id nullable string
   - avatar nullable string
   - email nullable string (si se usa)
   - añade índices y unique(provider, provider_id)
4) Añade rutas en routes/api.php.
5) No usar Blade. Todo API. Solo redirecciones en redirect/callback.
Criterio: route:list muestra auth/google/redirect y callback. Al completar el flujo, /api/auth/me devuelve el usuario autenticado (cookie).
