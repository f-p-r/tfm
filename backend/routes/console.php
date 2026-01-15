<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('auth:report', function () {
    $this->info('Auth Configuration Report');

    $frontend = rtrim((string) env('FRONTEND_URL', config('app.url')), '/');
    $allowedRaw = (string) env('ALLOWED_FRONTEND_URLS', '');
    $allowed = array_values(array_filter(array_map(function ($u) {
        $u = trim($u);
        return $u !== '' ? rtrim($u, '/') : '';
    }, explode(',', $allowedRaw))));

    $this->line('  FRONTEND_URL: '.($frontend ?: '(not set)'));
    $this->line('  ALLOWED_FRONTEND_URLS: '.(empty($allowed) ? '(none)' : implode(', ', $allowed)));

    $stateful = config('sanctum.stateful');
    $this->line('  SANCTUM_STATEFUL_DOMAINS: '.(is_array($stateful) ? implode(', ', $stateful) : (string) $stateful));

    $this->line('  CORS:');
    $this->line('    paths: '.implode(', ', (array) config('cors.paths', [])));
    $this->line('    supports_credentials: '.(config('cors.supports_credentials') ? 'true' : 'false'));
    $this->line('    allowed_origins: '.implode(', ', (array) config('cors.allowed_origins', [])));
    $this->line('    allowed_origins_patterns: '.implode(', ', (array) config('cors.allowed_origins_patterns', [])));

    $this->line('  Session:');
    $this->line('    driver: '.config('session.driver'));
    $this->line('    same_site: '.var_export(config('session.same_site'), true));
    $this->line('    secure: '.var_export(config('session.secure'), true));
    $this->line('    domain: '.var_export(config('session.domain'), true));

    // Route checks
    $router = app('router');
    $routes = $router->getRoutes();
    $uris = [];
    foreach ($routes as $route) {
        $uris[] = $route->uri();
    }

    $check = function (string $uri) use ($uris) {
        return in_array($uri, $uris, true) ? 'OK' : 'MISSING';
    };

    $this->line('  Routes:');
    foreach ([
        'sanctum/csrf-cookie',
        'api/auth/login',
        'api/auth/logout',
        'api/auth/me',
        'api/auth/{provider}/redirect',
        'api/auth/{provider}/callback',
    ] as $uri) {
        $this->line('    '.$uri.': '.$check($uri));
    }

    // Warnings and recommendations
    $this->newLine();
    $this->info('Warnings & Recommendations');

    // Parse URLs
    $frontUrl = $frontend;
    $appUrl = rtrim((string) config('app.url'), '/');
    $frontParts = parse_url($frontUrl ?: '') ?: [];
    $appParts = parse_url($appUrl ?: '') ?: [];
    $frontHost = $frontParts['host'] ?? null;
    $frontPort = $frontParts['port'] ?? (($frontParts['scheme'] ?? '') === 'https' ? 443 : 80);
    $frontOrigin = ($frontParts['scheme'] ?? 'http').'://'.($frontHost ?? '');
    if ($frontHost) {
        $frontOrigin .= in_array($frontPort, [80, 443], true) ? '' : ':'.$frontPort;
    }
    $appHost = $appParts['host'] ?? null;
    $appScheme = $appParts['scheme'] ?? null;
    $isCrossSite = $frontHost && $appHost && ($frontHost !== $appHost);

    // Check FRONTEND_URL presence in ALLOWED_FRONTEND_URLS
    if (! empty($allowed)) {
        if (! in_array($frontUrl, $allowed, true)) {
            $this->warn(' - FRONTEND_URL is not included in ALLOWED_FRONTEND_URLS. Add it to prevent open redirects.');
        }
    } else {
        $this->warn(' - ALLOWED_FRONTEND_URLS is empty. Consider setting it to restrict redirect targets.');
    }

    // Check sanctum stateful domains include frontend origin host:port
    $statefulArr = (array) config('sanctum.stateful', []);
    $hostPort = $frontHost ? ($frontPort ? $frontHost.':'.$frontPort : $frontHost) : null;
    if ($hostPort && ! in_array($hostPort, $statefulArr, true) && ! in_array($frontHost, $statefulArr, true)) {
        $this->warn(' - SANCTUM_STATEFUL_DOMAINS missing '.$hostPort.' (or host). Add it for stateful cookies.');
    }

    // Check CORS supports credentials and allowed origin includes frontend origin
    if (! config('cors.supports_credentials')) {
        $this->warn(' - CORS supports_credentials=false. Enable it for cookie-based auth.');
    }
    $allowedOrigins = (array) config('cors.allowed_origins', []);
    $allowedPatterns = (array) config('cors.allowed_origins_patterns', []);
    $matchedPattern = false;
    foreach ($allowedPatterns as $pattern) {
        if (@preg_match('/'.$pattern.'/', $frontOrigin)) {
            $matchedPattern = true;
            break;
        }
    }
    if ($frontOrigin && ! in_array($frontOrigin, $allowedOrigins, true) && ! $matchedPattern) {
        $this->warn(' - CORS allowed_origins/patterns do not include '.$frontOrigin.'. Add it to allow the SPA origin.');
    }

    // Session SameSite/Secure recommendations for HTTPS or cross-site
    if ($isCrossSite) {
        if (strtolower((string) config('session.same_site')) !== 'none') {
            $this->warn(' - Session same_site is not "none" while cross-site. Set SESSION_SAME_SITE=none for cross-site cookies.');
        }
        if ($appScheme === 'https' && ! config('session.secure')) {
            $this->warn(' - Session secure cookie is false on HTTPS. Set SESSION_SECURE_COOKIE=true.');
        }
    }

    $this->newLine();
    $this->info('Done.');
})->purpose('Report SPA auth configuration and required routes');
