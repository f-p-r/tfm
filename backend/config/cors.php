<?php

// Build list of allowed origins from frontend configuration
$frontendUrl = (string) env('FRONTEND_URL', '');
$frontendHost = env('FRONTEND_HOST', '');

$allowedOrigins = [];

// Add explicit frontend URL if set
if ($frontendUrl) {
    $allowedOrigins[] = rtrim($frontendUrl, '/');
}

// Add common development ports for the frontend host
if ($frontendHost) {
    foreach ([80, 443, 3000, 4200, 8080, 8100] as $port) {
        $allowedOrigins[] = 'http://'.$frontendHost.':'.$port;
        $allowedOrigins[] = 'https://'.$frontendHost.':'.$port;
    }
    // Also without port
    $allowedOrigins[] = 'http://'.$frontendHost;
    $allowedOrigins[] = 'https://'.$frontendHost;
}

// Fallback: common localhost variations if nothing else configured
if (empty($allowedOrigins)) {
    $allowedOrigins = [
        'http://localhost:4200',
        'http://localhost:3000',
        'http://localhost:8080',
        'http://127.0.0.1:4200',
    ];
}

return [
    // Apply CORS to API and CSRF cookie endpoint used by Sanctum
    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    // Allow common HTTP methods
    'allowed_methods' => ['*'],

    // Explicit allowed origins (works more reliably than patterns)
    'allowed_origins' => array_values(array_unique($allowedOrigins)),

    'allowed_origins_patterns' => [],

    // Allow typical request headers
    'allowed_headers' => ['*'],

    // Headers exposed to the browser
    'exposed_headers' => [],

    // Preflight cache duration (seconds)
    'max_age' => 0,

    // Allow cookies to be sent across origins
    'supports_credentials' => true,
];
