<p align="center"><a href="https://laravel.com" target="_blank"><img src="https://raw.githubusercontent.com/laravel/art/master/logo-lockup/5%20SVG/2%20CMYK/1%20Full%20Color/laravel-logolockup-cmyk-red.svg" width="400" alt="Laravel Logo"></a></p>

<p align="center">
<a href="https://github.com/laravel/framework/actions"><img src="https://github.com/laravel/framework/workflows/tests/badge.svg" alt="Build Status"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/dt/laravel/framework" alt="Total Downloads"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/v/laravel/framework" alt="Latest Stable Version"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/l/laravel/framework" alt="License"></a>
</p>

## About Laravel

Laravel is a web application framework with expressive, elegant syntax. We believe development must be an enjoyable and creative experience to be truly fulfilling. Laravel takes the pain out of development by easing common tasks used in many web projects, such as:

- [Simple, fast routing engine](https://laravel.com/docs/routing).
- [Powerful dependency injection container](https://laravel.com/docs/container).
- Multiple back-ends for [session](https://laravel.com/docs/session) and [cache](https://laravel.com/docs/cache) storage.
- Expressive, intuitive [database ORM](https://laravel.com/docs/eloquent).
- Database agnostic [schema migrations](https://laravel.com/docs/migrations).
- [Robust background job processing](https://laravel.com/docs/queues).
- [Real-time event broadcasting](https://laravel.com/docs/broadcasting).

Laravel is accessible, powerful, and provides tools required for large, robust applications.

## SPA Auth + Social Login Setup

- **Sanctum (cookie, stateful):** Ensure `EnsureFrontendRequestsAreStateful` is enabled in [bootstrap/app.php](bootstrap/app.php). CORS must allow your SPA origin and credentials in [config/cors.php](config/cors.php) for paths `api/*` and `sanctum/csrf-cookie`.
- **Stateful domains:** Adjust [config/sanctum.php](config/sanctum.php) to include your SPA host (e.g., `localhost:4200`).
- **Socialite providers:** Configure [config/services.php](config/services.php) with Google/Facebook keys and callback URLs.
- **Security hardening:** Social callback validates CSRF `state` and restricts redirects to allowed frontends via `ALLOWED_FRONTEND_URLS`.

### Environment Variables

- **Frontend:** `FRONTEND_URL`, `ALLOWED_FRONTEND_URLS` (comma-separated). Example: `http://localhost:4200`.
- **Google:** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URL` (default: `${APP_URL}/api/auth/google/callback`).
- **Facebook:** `FACEBOOK_CLIENT_ID`, `FACEBOOK_CLIENT_SECRET`, `FACEBOOK_REDIRECT_URL` (default: `${APP_URL}/api/auth/facebook/callback`).
- **Sessions (optional cross-site):** Consider `SESSION_DOMAIN`, `SESSION_SAME_SITE=none`, and `SESSION_SECURE_COOKIE=true` for HTTPS.

### Quick Start

1. Copy `.env.example` to `.env` and fill provider keys.
2. Install deps and run migrations.
3. Start server and test the flow.

#### Commands

```powershell
Push-Location "c:\master\tfm-src\backend"
composer install
php artisan migrate --force
php artisan serve
vendor\bin\phpunit --testdox tests/Feature/SocialAuthTest.php
```

### SPA Flow

- `GET /sanctum/csrf-cookie` with credentials.
- `GET /api/auth/google/redirect` (or `facebook`).
- After provider auth, backend redirects to `FRONTEND_URL/auth/callback?provider=...&ok=1`.
- `GET /api/auth/me` returns authenticated user.

## Provider Setup (Google & Facebook)

See detailed steps in [docs/social-providers.md](docs/social-providers.md). Summary:

- **Google**
	- Create a project in Google Cloud Console and configure OAuth consent screen.
	- Create OAuth 2.0 Client (type Web Application).
	- Authorized redirect URI: `${APP_URL}/api/auth/google/callback`.
	- Authorized JavaScript origins: your `FRONTEND_URL` (e.g., `http://localhost:4200`).
	- Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` and optionally `GOOGLE_REDIRECT_URL`.

- **Facebook**
	- Create an app in Meta for Developers (Facebook Login).
	- Configure Valid OAuth Redirect URIs: `${APP_URL}/api/auth/facebook/callback`.
	- App Domains / Site URL: your backend `APP_URL` and frontend domain.
	- Set `FACEBOOK_CLIENT_ID`, `FACEBOOK_CLIENT_SECRET` and optionally `FACEBOOK_REDIRECT_URL`.

Ensure `ALLOWED_FRONTEND_URLS` includes your `FRONTEND_URL` to allow safe redirects.

## Learning Laravel

Laravel has the most extensive and thorough [documentation](https://laravel.com/docs) and video tutorial library of all modern web application frameworks, making it a breeze to get started with the framework. You can also check out [Laravel Learn](https://laravel.com/learn), where you will be guided through building a modern Laravel application.

If you don't feel like reading, [Laracasts](https://laracasts.com) can help. Laracasts contains thousands of video tutorials on a range of topics including Laravel, modern PHP, unit testing, and JavaScript. Boost your skills by digging into our comprehensive video library.

## Laravel Sponsors

We would like to extend our thanks to the following sponsors for funding Laravel development. If you are interested in becoming a sponsor, please visit the [Laravel Partners program](https://partners.laravel.com).

### Premium Partners

- **[Vehikl](https://vehikl.com)**
- **[Tighten Co.](https://tighten.co)**
- **[Kirschbaum Development Group](https://kirschbaumdevelopment.com)**
- **[64 Robots](https://64robots.com)**
- **[Curotec](https://www.curotec.com/services/technologies/laravel)**
- **[DevSquad](https://devsquad.com/hire-laravel-developers)**
- **[Redberry](https://redberry.international/laravel-development)**
- **[Active Logic](https://activelogic.com)**

## Contributing

Thank you for considering contributing to the Laravel framework! The contribution guide can be found in the [Laravel documentation](https://laravel.com/docs/contributions).

## Code of Conduct

In order to ensure that the Laravel community is welcoming to all, please review and abide by the [Code of Conduct](https://laravel.com/docs/contributions#code-of-conduct).

## Security Vulnerabilities

If you discover a security vulnerability within Laravel, please send an e-mail to Taylor Otwell via [taylor@laravel.com](mailto:taylor@laravel.com). All security vulnerabilities will be promptly addressed.

## License

The Laravel framework is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).
