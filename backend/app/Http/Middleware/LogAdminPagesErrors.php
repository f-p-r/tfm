<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

class LogAdminPagesErrors
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Solo activar si está habilitado en configuración
        if (!config('app.log_admin_pages_errors')) {
            return $next($request);
        }

        try {
            $response = $next($request);

            // Loggear respuestas con código de error (4xx, 5xx)
            if ($response->getStatusCode() >= 400) {
                $this->logError($request, $response);
            }

            return $response;
        } catch (Throwable $e) {
            // Loggear excepciones no capturadas
            $this->logException($request, $e);
            throw $e;
        }
    }

    /**
     * Log error responses
     */
    private function logError(Request $request, Response $response): void
    {
        Log::channel('single')->error('❌ Admin Pages Error', [
            'method' => $request->method(),
            'url' => $request->fullUrl(),
            'route' => $request->route()?->getName() ?? $request->path(),
            'status_code' => $response->getStatusCode(),
            'request_data' => [
                'query' => $request->query->all(),
                'body' => $request->except(['password', 'password_confirmation']),
            ],
            'response_body' => $this->getResponseContent($response),
            'user_id' => $request->user()?->id,
            'ip' => $request->ip(),
        ]);
    }

    /**
     * Log exceptions
     */
    private function logException(Request $request, Throwable $e): void
    {
        Log::channel('single')->error('❌ Admin Pages Exception', [
            'method' => $request->method(),
            'url' => $request->fullUrl(),
            'route' => $request->route()?->getName() ?? $request->path(),
            'exception' => get_class($e),
            'message' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'request_data' => [
                'query' => $request->query->all(),
                'body' => $request->except(['password', 'password_confirmation']),
            ],
            'user_id' => $request->user()?->id,
            'ip' => $request->ip(),
        ]);
    }

    /**
     * Get response content safely
     */
    private function getResponseContent(Response $response): mixed
    {
        $content = $response->getContent();

        if (empty($content)) {
            return null;
        }

        $decoded = json_decode($content, true);
        return $decoded ?? $content;
    }
}
