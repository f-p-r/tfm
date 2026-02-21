/**
 * Servicio API para noticias.
 *
 * Encapsula todas las llamadas HTTP al endpoint /api/news.
 * No incluye caché — usar en componentes que gestionen su propio estado de carga.
 *
 * Endpoints cubiertos:
 * - GET    /api/news         → listado con filtros opcionales
 * - GET    /api/news/{id}    → detalle completo con content
 * - POST   /api/news         → crear noticia
 * - PATCH  /api/news/{id}    → actualizar parcialmente
 * - DELETE /api/news/{id}    → eliminar
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { isLaravelValidationError } from '../auth/laravel-validation-error';
import {
  NewsDTO,
  NewsSummaryDTO,
  NewsCreateDTO,
  NewsUpdateDTO,
  NewsListParams,
} from './news.models';

@Injectable({ providedIn: 'root' })
export class NewsApiService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${environment.apiBaseUrl}/api/news`;

  /**
   * Obtiene el listado de noticias con filtros opcionales.
   * Por defecto solo devuelve noticias publicadas.
   *
   * @param params Filtros opcionales (scope, juego, borradores)
   */
  list(params: NewsListParams = {}): Observable<NewsSummaryDTO[]> {
    let httpParams = new HttpParams();

    if (params.scopeType !== undefined) {
      httpParams = httpParams.set('scope_type', params.scopeType);
    }
    if (params.scopeId !== undefined) {
      httpParams = httpParams.set('scope_id', params.scopeId);
    }
    if (params.gameId !== undefined) {
      httpParams = httpParams.set('game_id', params.gameId);
    }
    if (params.includeUnpublished) {
      httpParams = httpParams.set('include_unpublished', 'true');
    }

    return this.http
      .get<NewsSummaryDTO[]>(this.endpoint, { params: httpParams })
      .pipe(catchError((err) => this.handleError(err)));
  }

  /**
   * Obtiene el detalle completo de una noticia por ID (incluye content).
   * Las noticias no publicadas requieren autenticación y permiso news.edit.
   *
   * @param id ID de la noticia
   */
  getById(id: number): Observable<NewsDTO> {
    return this.http
      .get<NewsDTO>(`${this.endpoint}/${id}`)
      .pipe(catchError((err) => this.handleError(err)));
  }

  /**
   * Crea una nueva noticia.
   * Requiere autenticación y permiso news.edit en el scope indicado.
   *
   * @param data Datos de la noticia a crear
   */
  create(data: NewsCreateDTO): Observable<NewsDTO> {
    return this.http
      .post<NewsDTO>(this.endpoint, this.toSnakeCase(data as unknown as Record<string, unknown>))
      .pipe(catchError((err) => this.handleError(err)));
  }

  /**
   * Actualiza parcialmente una noticia.
   * Solo se envían los campos a modificar.
   * scope_type y scope_id no son modificables.
   *
   * @param id ID de la noticia
   * @param data Campos a actualizar
   */
  update(id: number, data: NewsUpdateDTO): Observable<NewsDTO> {
    return this.http
      .patch<NewsDTO>(`${this.endpoint}/${id}`, this.toSnakeCase(data as unknown as Record<string, unknown>))
      .pipe(catchError((err) => this.handleError(err)));
  }

  /**
   * Elimina una noticia.
   * Requiere autenticación y permiso news.edit en el scope de la noticia.
   *
   * @param id ID de la noticia
   */
  delete(id: number): Observable<void> {
    return this.http
      .delete<void>(`${this.endpoint}/${id}`)
      .pipe(catchError((err) => this.handleError(err)));
  }

  /**
   * Convierte las claves camelCase del DTO a snake_case para el backend.
   * Solo convierte los campos de primer nivel conocidos.
   */
  private toSnakeCase(data: Record<string, unknown>): Record<string, unknown> {
    const map: Record<string, string> = {
      scopeType: 'scope_type',
      scopeId: 'scope_id',
      gameId: 'game_id',
      publishedAt: 'published_at',
    };

    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      result[map[key] ?? key] = value;
    }
    return result;
  }

  /**
   * Maneja errores HTTP normalizando el formato de error para los componentes.
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    if (error.status === 401) {
      return throwError(() => ({ status: 401, message: 'No autenticado' }));
    }
    if (error.status === 403) {
      return throwError(() => ({ status: 403, message: 'Sin permisos para gestionar esta noticia' }));
    }
    if (error.status === 404) {
      return throwError(() => ({ status: 404, message: 'Noticia no encontrada' }));
    }
    if (isLaravelValidationError(error)) {
      return throwError(() => ({
        status: 422,
        message: 'Error de validación',
        errors: error.error.errors,
      }));
    }
    return throwError(() => ({ status: (error as { status?: number }).status ?? 0, message: 'Error del servidor' }));
  }
}
