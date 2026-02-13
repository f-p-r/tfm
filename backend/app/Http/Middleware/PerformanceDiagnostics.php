<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class PerformanceDiagnostics
{
    private float $startTime;
    private int $queryCount = 0;
    private float $queryTimeTotal = 0;

    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Solo activar en entorno local
        if (config('app.env') !== 'local') {
            return $next($request);
        }

        // Iniciar medición de tiempo
        $this->startTime = microtime(true);
        $this->queryCount = 0;
        $this->queryTimeTotal = 0;

        // Escuchar queries de base de datos
        DB::listen(function ($query) {
            $this->queryCount++;
            $this->queryTimeTotal += $query->time;
        });

        // Continuar con el request
        $response = $next($request);

        // Calcular tiempo total
        $totalTime = (microtime(true) - $this->startTime) * 1000; // en milisegundos

        // Loguear métricas de rendimiento
        Log::channel('single')->info('🚀 Performance Diagnostics', [
            'method' => $request->method(),
            'url' => $request->fullUrl(),
            'route' => $request->route()?->getName() ?? $request->path(),
            'total_time_ms' => round($totalTime, 2),
            'query_count' => $this->queryCount,
            'query_time_ms' => round($this->queryTimeTotal, 2),
            'query_percentage' => $this->queryCount > 0
                ? round(($this->queryTimeTotal / $totalTime) * 100, 1) . '%'
                : '0%',
            'non_query_time_ms' => round($totalTime - $this->queryTimeTotal, 2),
            'memory_mb' => round(memory_get_peak_usage(true) / 1024 / 1024, 2),
        ]);

        return $response;
    }
}
