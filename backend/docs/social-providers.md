# Social Providers Setup (Google & Facebook)

This project uses Laravel Socialite for Google and Facebook login with a SPA frontend and Sanctum cookies.

## Prerequisites
- Backend `APP_URL` reachable by the provider (e.g., `http://localhost:8000`).
- SPA frontend `FRONTEND_URL` (e.g., `http://localhost:4200`).
- CORS allows the SPA origin and credentials (see `config/cors.php`).
- `ALLOWED_FRONTEND_URLS` includes the SPA URL to restrict redirects.

## Google (OAuth 2.0)
1. Go to Google Cloud Console → APIs & Services → OAuth consent screen.
   - Create an external (or internal) consent screen; add basic app info.
   - Add test users if needed while in testing mode.
2. Create credentials: OAuth Client ID → Application type: Web application.
   - Name: e.g., `Backend API`.
   - Authorized JavaScript origins:
     - `http://localhost:4200` (your SPA `FRONTEND_URL`).
   - Authorized redirect URIs:
     - `http://localhost:8000/api/auth/google/callback` (your backend `APP_URL`).
3. Save and copy `Client ID` and `Client Secret`.
4. Configure environment:
   - `GOOGLE_CLIENT_ID=...`
   - `GOOGLE_CLIENT_SECRET=...`
   - Optionally: `GOOGLE_REDIRECT_URL=http://localhost:8000/api/auth/google/callback`

## Facebook (Meta for Developers)
1. Go to https://developers.facebook.com → Create App → `Consumer` type.
2. Add Product: Facebook Login → Web.
3. In Facebook Login settings:
   - Valid OAuth Redirect URIs:
     - `http://localhost:8000/api/auth/facebook/callback`
   - App Domains: include your backend domain.
   - (If applicable) Client OAuth Login: enabled.
4. Copy `App ID` and `App Secret`.
5. Configure environment:
   - `FACEBOOK_CLIENT_ID=...` (App ID)
   - `FACEBOOK_CLIENT_SECRET=...` (App Secret)
   - Optionally: `FACEBOOK_REDIRECT_URL=http://localhost:8000/api/auth/facebook/callback`

## Backend & SPA Notes
- Sanctum cookie-based auth requires:
  - `EnsureFrontendRequestsAreStateful` middleware configured in `bootstrap/app.php`.
  - `SANCTUM_STATEFUL_DOMAINS` includes SPA host (localhost:4200, etc.).
  - Session driver working (e.g., `database`) and session table migrated.
- SPA flow:
  - `GET /sanctum/csrf-cookie` (with credentials).
  - `GET /api/auth/{provider}/redirect` → provider consent.
  - Provider returns to `/api/auth/{provider}/callback` → backend logs in (`Auth::login`) and redirects to `FRONTEND_URL/auth/callback?...`.
  - SPA calls `/api/auth/me` to fetch the authenticated user.

## Security Hardening
- Backend validates CSRF `state`/nonce: generated at redirect and checked at callback.
- Redirect base is validated against `ALLOWED_FRONTEND_URLS` (comma-separated list).
- Provider error query parameters (`error`, `error_reason`, `error_description`) are forwarded with `ok=0`.

## Troubleshooting
- **Invalid state**: Ensure the session persists (correct session driver, cookies allowed, same-site settings if cross-site).
- **CORS blocked**: Confirm `config/cors.php` allows SPA origin, headers, and credentials for `api/*` and `sanctum/csrf-cookie`.
- **Cookie not set**: For HTTPS and cross-site, use `SESSION_SAME_SITE=none` and `SESSION_SECURE_COOKIE=true` and serve over HTTPS.
- **Provider mismatch**: Verify redirect URLs exactly match what you registered.

## Quick Commands
```powershell
Push-Location "c:\master\tfm-src\backend"
copy .env.example .env
composer install
php artisan migrate --force
php artisan serve
vendor\bin\phpunit --testdox tests/Feature/SocialAuthTest.php
```
