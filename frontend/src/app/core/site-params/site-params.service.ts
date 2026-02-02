import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

/**
 * Servicio para gestión de parámetros globales del sitio.
 * Los parámetros se almacenan siempre como strings en el backend.
 */
@Injectable({
  providedIn: 'root',
})
export class SiteParamsService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = environment.apiBaseUrl;

  /**
   * Obtiene un parámetro como string.
   * @param id Identificador del parámetro
   * @returns Observable con el valor string o null si no existe
   */
  getString(id: string): Observable<string | null> {
    return this.http
      .get<{ id: string; value: string }>(`${this.apiBaseUrl}/api/site-params/${id}`)
      .pipe(
        map((response) => response.value),
        catchError((error) => {
          if (error.status === 404) {
            return of(null);
          }
          console.error(`Error getting site param '${id}':`, error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Obtiene un parámetro parseado como número.
   * @param id Identificador del parámetro
   * @returns Observable con el valor numérico o null si no existe o no es válido
   */
  getNumber(id: string): Observable<number | null> {
    return this.getString(id).pipe(
      map((value) => {
        if (value === null) return null;
        const parsed = parseInt(value, 10);
        return isNaN(parsed) ? null : parsed;
      })
    );
  }

  /**
   * Establece un parámetro string.
   * Si el parámetro no existe, lo crea (upsert).
   * @param id Identificador del parámetro
   * @param value Valor a guardar
   */
  setString(id: string, value: string): Observable<void> {
    return this.http
      .post<{ id: string; value: string; createdAt: string; updatedAt: string }>(
        `${this.apiBaseUrl}/api/admin/site-params/${id}`,
        { value }
      )
      .pipe(
        map(() => undefined),
        catchError((error) => {
          console.error(`Error setting site param '${id}':`, error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Establece un parámetro numérico (lo convierte a string).
   * Si el parámetro no existe, lo crea (upsert).
   * @param id Identificador del parámetro
   * @param value Valor numérico a guardar
   */
  setNumber(id: string, value: number): Observable<void> {
    return this.setString(id, value.toString());
  }
}
