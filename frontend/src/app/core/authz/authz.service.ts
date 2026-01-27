/**
 * Servicio con caché en memoria (TTL) para consultas de autorización.
 * Encapsula `AuthzApiService` añadiendo deduplicación y caché simple.
 *
 * Ejemplo:
 * ```
 * constructor(private authz = inject(AuthzService)) {}
 *
 * consultar() {
 *   this.authz.query({
 *     scopeType: WebScope.GAME,
 *     scopeIds: [1],
 *     permissions: ['edit'],
 *     breakdown: false
 *   }).subscribe(res => console.log(res));
 * }
 * ```
 *
 * Funcionamiento:
 *
 * 1. Normaliza request → genera cacheKey estable
 * 2. Revisa caché: si existe y TTL válido, devuelve sin backend
 * 3. Si no existe: verifica inFlight para deduplicar
 * 4. Realiza llamada, cachea resultado
 * 5. En error 401: limpia caché automáticamente
 */

import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, shareReplay, tap } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthzApiService } from './authz-api.service';
import { AuthzQueryRequest, AuthzQueryResponse } from './authz.models';

/**
 * Entrada de caché con marca temporal.
 */
interface CacheEntry {
  value: AuthzQueryResponse;
  fetchedAt: number;
}

@Injectable({ providedIn: 'root' })
export class AuthzService {
  private readonly api = inject(AuthzApiService);

  /** TTL del caché en milisegundos. Por defecto 120 segundos. */
  private readonly cacheTtlMs = 120_000;

  /** Caché en memoria: clave → valor + timestamp */
  private readonly cache = new Map<string, CacheEntry>();

  /** Mapa de peticiones en vuelo (deduplicación): clave → Observable compartido */
  private readonly inFlight = new Map<string, Observable<AuthzQueryResponse>>();

  /**
   * Consulta permisos con caché en memoria y deduplicación.
   *
   * @param req Solicitud de permisos.
   * @returns Observable con la respuesta cacheada o fresca.
   */
  query(req: AuthzQueryRequest): Observable<AuthzQueryResponse> {
    const cacheKey = this.generateCacheKey(req);

    // Si hay entrada en caché válida (no expirada), devolverla
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return new Observable((subscriber) => {
        subscriber.next(cached);
        subscriber.complete();
      });
    }

    // Si ya hay una llamada en vuelo para esta clave, reutilizarla
    if (this.inFlight.has(cacheKey)) {
      return this.inFlight.get(cacheKey)!;
    }

    // Hacer la llamada al backend, deduplicarla y cachearla
    const request$ = this.api.query(req).pipe(
      tap((res) => this.setInCache(cacheKey, res)),
      catchError((err: HttpErrorResponse) => {
        // Si es 401, limpiar toda la caché (sesión probablemente perdida)
        if (err.status === 401) {
          this.clearCache();
        }
        // Eliminar entrada en vuelo antes de propagar el error
        this.inFlight.delete(cacheKey);
        return throwError(() => err);
      }),
      // Deduplicación: los siguientes suscriptores reutilizarán esta llamada
      shareReplay(1),
      // Limpiar registro en vuelo cuando se completa
      tap(
        () => this.inFlight.delete(cacheKey),
        () => this.inFlight.delete(cacheKey)
      )
    );

    this.inFlight.set(cacheKey, request$);
    return request$;
  }

  /**
   * Limpia todo el caché en memoria.
   * Útil para invalidación manual o cambios de sesión.
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Genera una clave de caché estable basada en el request.
   * Depende de: scopeType, breakdown, scopeIds (asc), permissions (asc).
   *
   * @param req Solicitud.
   * @returns Clave única para la caché.
   */
  private generateCacheKey(req: AuthzQueryRequest): string {
    const normalized = this.normalizeRequest(req);
    const scopeIds = normalized.scopeIds.join(',');
    const permissions = normalized.permissions.join(',');
    return `scopeType=${normalized.scopeType}|breakdown=${normalized.breakdown}|scopeIds=${scopeIds}|perms=${permissions}`;
  }

  /**
   * Normaliza el request para caché:
   * - scopeIds ordenados numéricamente (asc).
   * - permissions ordenadas alfabéticamente (asc).
   * - Arrays vacíos si undefined.
   *
   * @param req Solicitud sin normalizar.
   * @returns Solicitud normalizada.
   */
  private normalizeRequest(req: AuthzQueryRequest): AuthzQueryRequest {
    return {
      scopeType: req.scopeType,
      scopeIds: (req.scopeIds ?? []).slice().sort((a, b) => a - b),
      permissions: (req.permissions ?? []).slice().sort(),
      breakdown: req.breakdown,
    };
  }

  /**
   * Obtiene un valor del caché si existe y no ha expirado.
   *
   * @param cacheKey Clave del caché.
   * @returns Valor si existe y es válido; undefined si expirado o no existe.
   */
  private getFromCache(cacheKey: string): AuthzQueryResponse | undefined {
    const entry = this.cache.get(cacheKey);
    if (!entry) return undefined;

    const now = Date.now();
    const age = now - entry.fetchedAt;

    // Si el TTL ha expirado, eliminar del caché y devolver undefined
    if (age > this.cacheTtlMs) {
      this.cache.delete(cacheKey);
      return undefined;
    }

    return entry.value;
  }

  /**
   * Almacena un valor en el caché con marca temporal actual.
   *
   * @param cacheKey Clave del caché.
   * @param value Valor a cachear.
   */
  private setInCache(cacheKey: string, value: AuthzQueryResponse): void {
    this.cache.set(cacheKey, {
      value,
      fetchedAt: Date.now(),
    });
  }
}
