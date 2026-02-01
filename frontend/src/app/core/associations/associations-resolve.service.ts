import { Injectable, inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { tap, shareReplay, catchError } from 'rxjs/operators';
import { AssociationsApiService } from './associations-api.service';
import { Association } from './associations.models';
import { slugify } from '../../shared/utils/slugify';

/** Tiempo de vida de la caché en milisegundos (10 minutos) */
const ASSOCIATIONS_TTL_MS = 10 * 60 * 1000;

/** Entrada de caché con valor y timestamp */
interface CacheEntry {
  value: Association;
  fetchedAt: number;
}

/**
 * Servicio para resolver asociaciones por slug con caché in-memory y deduplicación.
 *
 * Características:
 * - TTL de 10 minutos
 * - Normalización de slugs con slugify()
 * - Deduplicación de peticiones in-flight
 * - SSR-friendly (sin localStorage)
 */
@Injectable({ providedIn: 'root' })
export class AssociationsResolveService {
  private readonly api = inject(AssociationsApiService);

  /** Caché in-memory con TTL */
  private readonly cache = new Map<string, CacheEntry>();

  /** Observables in-flight para deduplicación */
  private readonly inFlight = new Map<string, Observable<Association>>();

  /**
   * Resuelve una asociación por su slug, con caché y deduplicación.
   *
   * @param slug Slug de la asociación (será normalizado con slugify).
   * @returns Observable con los datos de la asociación.
   */
  resolveBySlug(slug: string): Observable<Association> {
    // Normalizar slug para búsqueda y caché
    const key = slugify(slug);

    // Verificar caché
    const cached = this.cache.get(key);
    if (cached && this.isCacheValid(cached.fetchedAt)) {
      return of(cached.value);
    }

    // Si hay petición in-flight, reutilizarla
    const existing = this.inFlight.get(key);
    if (existing) {
      return existing;
    }

    // Iniciar nueva petición
    const request$ = this.api.getBySlug(key).pipe(
      tap((association) => {
        // Guardar en caché
        this.cache.set(key, {
          value: association,
          fetchedAt: Date.now(),
        });
        // Limpiar in-flight
        this.inFlight.delete(key);
      }),
      catchError((err) => {
        // Limpiar in-flight en caso de error
        this.inFlight.delete(key);
        return throwError(() => err);
      }),
      shareReplay(1)
    );

    // Guardar in-flight
    this.inFlight.set(key, request$);
    return request$;
  }

  /**
   * Resuelve una asociación por su ID, con caché y deduplicación.
   *
   * @param id ID de la asociación.
   * @returns Observable con los datos de la asociación.
   */
  resolveById(id: number): Observable<Association> {
    // Verificar caché buscando por ID
    const cached = this.getById(id);
    if (cached) {
      return of(cached);
    }

    // Clave para in-flight por ID
    const key = `id:${id}`;

    // Si hay petición in-flight, reutilizarla
    const existing = this.inFlight.get(key);
    if (existing) {
      return existing;
    }

    // Iniciar nueva petición
    const request$ = this.api.getById(id).pipe(
      tap((association) => {
        // Guardar en caché usando el slug como clave
        const slugKey = slugify(association.slug);
        this.cache.set(slugKey, {
          value: association,
          fetchedAt: Date.now(),
        });
        // Limpiar in-flight
        this.inFlight.delete(key);
      }),
      catchError((err) => {
        // Limpiar in-flight en caso de error
        this.inFlight.delete(key);
        return throwError(() => err);
      }),
      shareReplay(1)
    );

    // Guardar in-flight
    this.inFlight.set(key, request$);
    return request$;
  }

  /**
   * Busca una asociación en la caché por su ID.
   * Método síncrono que solo consulta la caché existente.
   *
   * @param id ID de la asociación.
   * @returns La asociación si está en caché, undefined si no.
   */
  getById(id: number): Association | undefined {
    for (const entry of this.cache.values()) {
      if (entry.value.id === id && this.isCacheValid(entry.fetchedAt)) {
        return entry.value;
      }
    }
    return undefined;
  }

  /**
   * Limpia toda la caché de asociaciones.
   * Útil para invalidación manual.
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Verifica si una entrada de caché es válida según el TTL.
   *
   * @param fetchedAt Timestamp de cuando se obtuvo el dato.
   * @returns true si la caché es válida, false si expiró.
   */
  private isCacheValid(fetchedAt: number): boolean {
    return (Date.now() - fetchedAt) < ASSOCIATIONS_TTL_MS;
  }
}
