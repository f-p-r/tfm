# Diagnóstico de Rendimiento Laravel

Este documento explica cómo usar y interpretar las herramientas de diagnóstico de rendimiento implementadas en la aplicación.

## 🎯 Herramientas Disponibles

### 1. Endpoint `/api/ping`
Ruta simple que devuelve `{"ok": true}` sin tocar la base de datos ni ejecutar lógica compleja.

**Uso:**
```bash
curl http://localhost:8000/api/ping
```

**Propósito:** Medir la latencia base del servidor/entorno sin la sobrecarga de DB o lógica de negocio.

### 2. Middleware de Diagnóstico de Performance
Mide automáticamente el rendimiento de los endpoints configurados (por defecto: rutas `/api/admin/*`).

**Ubicación:** `app/Http/Middleware/PerformanceDiagnostics.php`

**Métricas capturadas:**
- `total_time_ms`: Tiempo total del request en milisegundos
- `query_count`: Número total de queries SQL ejecutadas
- `query_time_ms`: Tiempo acumulado de todas las queries
- `query_percentage`: Porcentaje del tiempo total dedicado a queries
- `non_query_time_ms`: Tiempo dedicado a lógica de aplicación (no DB)
- `memory_mb`: Pico de memoria utilizada

## 📊 Ejemplo de Log

```json
{
  "method": "GET",
  "url": "http://localhost:8000/api/admin/pages?owner_type=association&owner_id=1",
  "route": "api/admin/pages",
  "total_time_ms": 245.67,
  "query_count": 15,
  "query_time_ms": 178.45,
  "query_percentage": "72.6%",
  "non_query_time_ms": 67.22,
  "memory_mb": 12.5
}
```

## 🔍 Cómo Interpretar los Resultados

### Escenario 1: `/api/ping` es lento (>50ms)
**Síntoma:** El endpoint ping tarda más de 50ms en responder.

**Diagnóstico:** Problema de infraestructura/entorno.

**Causas posibles:**
- Servidor sobrecargado (CPU/memoria)
- Latencia de red alta
- Problema con el servidor web (Apache/Nginx)
- PHP-FPM lento o mal configurado

**Soluciones:**
- Verificar recursos del servidor: `htop` / `free -h`
- Revisar logs del servidor web
- Optimizar configuración PHP (opcache, memory_limit)
- Considerar mover a hardware más potente

---

### Escenario 2: Muchas queries (>10) con alto `query_count`
**Síntoma:** Un endpoint ejecuta muchas queries (>10-15) para una operación simple.

**Diagnóstico:** Problema de N+1 queries.

**Ejemplo del problema:**
```php
// ❌ MAL: N+1 queries
$pages = Page::all(); // 1 query
foreach ($pages as $page) {
    echo $page->owner->name; // N queries adicionales
}

// ✅ BIEN: Eager loading
$pages = Page::with('owner')->get(); // 2 queries total
```

**Cómo identificarlo en los logs:**
- `query_count` alto (>10)
- `query_percentage` alto (>60%)
- Múltiples queries similares

**Soluciones:**
- Usar `with()` para eager loading de relaciones
- Usar `load()` para lazy eager loading si es necesario
- Revisar el controlador y añadir eager loading:
  ```php
  Page::with(['owner', 'media'])->where(...)->get();
  ```

---

### Escenario 3: Alto `query_time_ms` con pocas queries
**Síntoma:** Pocas queries pero toman mucho tiempo (>100ms).

**Diagnóstico:** Queries lentas, falta de índices o queries ineficientes.

**Causas posibles:**
- Falta de índices en columnas filtradas/ordenadas
- Full table scans
- Queries complejas sin optimizar
- Tablas grandes sin particionamiento

**Soluciones:**
1. **Identificar la query lenta:**
   ```php
   // En PerformanceDiagnostics.php, añadir logging de queries lentas:
   DB::listen(function ($query) {
       if ($query->time > 50) { // queries >50ms
           Log::warning('Slow query detected', [
               'sql' => $query->sql,
               'bindings' => $query->bindings,
               'time' => $query->time
           ]);
       }
   });
   ```

2. **Analizar con EXPLAIN:**
   ```bash
   php artisan tinker
   >>> DB::enableQueryLog();
   >>> // Ejecutar el código problemático
   >>> DB::getQueryLog();
   ```

3. **Añadir índices:**
   ```php
   Schema::table('pages', function (Blueprint $table) {
       $table->index(['owner_type', 'owner_id']);
       $table->index('published_at');
   });
   ```

---

### Escenario 4: Alto `non_query_time_ms`
**Síntoma:** La mayoría del tiempo NO se gasta en queries (`query_percentage` < 30%).

**Diagnóstico:** Lógica de aplicación lenta.

**Causas posibles:**
- Procesamiento pesado en PHP (loops complejos)
- Llamadas a APIs externas
- Procesamiento de imágenes/archivos
- Serialización/deserialización compleja
- Muchas transformaciones de datos

**Soluciones:**
- Cachear resultados con `Cache::remember()`
- Mover procesamiento pesado a jobs en cola
- Optimizar algoritmos y loops
- Usar chunking para grandes datasets:
  ```php
  Page::chunk(100, function ($pages) {
      // Procesar en lotes
  });
  ```

---

### Escenario 5: Alto uso de memoria (`memory_mb` > 50MB)
**Síntoma:** Pico de memoria muy alto para una operación simple.

**Diagnóstico:** Carga excesiva de datos en memoria.

**Causas posibles:**
- Cargar demasiados registros de una vez
- No usar paginación
- Relaciones cargadas innecesariamente
- Caching interno de Laravel acumulando datos

**Soluciones:**
- Implementar paginación:
  ```php
  Page::paginate(20);
  ```
- Usar chunking para procesar grandes datasets
- Liberar memoria explícitamente en loops:
  ```php
  unset($largeArray);
  gc_collect_cycles();
  ```

---

## 🚀 Workflow de Diagnóstico Recomendado

1. **Establecer baseline:**
   ```bash
   # Medir ping para conocer latencia base
   curl http://localhost:8000/api/ping
   ```

2. **Probar endpoint problemático:**
   ```bash
   # Hacer request al endpoint que sospechas lento
   curl http://localhost:8000/api/admin/pages?owner_type=association&owner_id=1
   ```

3. **Revisar logs:**
   ```bash
   tail -f storage/logs/laravel.log | grep "Performance Diagnostics"
   ```

4. **Analizar métricas y aplicar soluciones según la tabla de decisión:**

| `total_time_ms` | `query_count` | `query_percentage` | Diagnóstico | Acción |
|-----------------|---------------|-------------------|-------------|---------|
| >500ms | Bajo (<5) | Bajo (<30%) | Ping lento | Revisar infraestructura |
| >300ms | Alto (>10) | Alto (>60%) | **N+1 queries** | **Añadir eager loading** |
| >300ms | Bajo (<5) | Alto (>60%) | Queries lentas | Añadir índices, optimizar SQL |
| >300ms | Medio | Bajo (<30%) | Lógica pesada | Cachear, jobs, optimizar código |
| Cualquiera | Cualquiera | Cualquiera + `memory_mb` >50 | Memory leak | Paginación, chunking |

---

## ⚙️ Configuración

### Activar/Desactivar el diagnóstico
El middleware solo se activa en `APP_ENV=local`. Para cambiar esto, edita:

**Archivo:** `app/Http/Middleware/PerformanceDiagnostics.php`
```php
if (config('app.env') !== 'local') {
    return $next($request);
}
```

### Añadir diagnóstico a más rutas
**Archivo:** `routes/api.php`
```php
// Opción 1: A un grupo específico
Route::prefix('users')->middleware('perf')->group(function () {
    // rutas...
});

// Opción 2: A una ruta individual
Route::get('some-route', [SomeController::class, 'method'])->middleware('perf');

// Opción 3: Solo en local (recomendado)
Route::prefix('users')->middleware(config('app.env') === 'local' ? ['perf'] : [])->group(function () {
    // rutas...
});
```

### Personalizar umbral de logging
Puedes modificar el middleware para solo loguear requests lentos:

```php
$totalTime = (microtime(true) - $this->startTime) * 1000;

// Solo loguear si tarda más de 100ms
if ($totalTime > 100) {
    Log::channel('single')->info('🚀 Performance Diagnostics', [
        // ... métricas
    ]);
}
```

---

## 📝 Ejemplos Prácticos

### Caso Real: Optimización de `/api/admin/pages`

**ANTES:**
```json
{
  "total_time_ms": 845.23,
  "query_count": 23,
  "query_percentage": "78.3%"
}
```

**Diagnóstico:** N+1 queries (muchas queries, alto porcentaje).

**Solución aplicada:**
```php
// AdminPagesController.php
public function indexByOwner(AdminPageIndexRequest $request): JsonResponse
{
    $pages = Page::query()
        ->with('owner', 'media') // ✅ Añadir eager loading
        ->where('owner_type', $ownerType)
        ->where('owner_id', $ownerId)
        ->orderByDesc('updated_at')
        ->get();
}
```

**DESPUÉS:**
```json
{
  "total_time_ms": 124.56,
  "query_count": 3,
  "query_percentage": "45.2%"
}
```

**Resultado:** ~85% de mejora en tiempo total, ~87% reducción en queries.

---

## 🔗 Referencias

- [Laravel Query Optimization](https://laravel.com/docs/11.x/eloquent-relationships#eager-loading)
- [Laravel Debugging](https://laravel.com/docs/11.x/logging)
- [Database Indexing Best Practices](https://use-the-index-luke.com/)
