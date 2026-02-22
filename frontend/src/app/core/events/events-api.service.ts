/**
 * Servicio API para eventos.
 *
 * Encapsula todas las llamadas HTTP al endpoint /api/events.
 * No incluye caché — usar en componentes que gestionen su propio estado de carga.
 *
 * Endpoints cubiertos:
 * - GET    /api/events         → listado con filtros opcionales
 * - GET    /api/events/{id}    → detalle completo con content
 * - POST   /api/events         → crear evento
 * - PATCH  /api/events/{id}    → actualizar parcialmente
 * - DELETE /api/events/{id}    → eliminar
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { isLaravelValidationError } from '../auth/laravel-validation-error';
import {
  EventDTO,
  EventSummaryDTO,
  EventCreateDTO,
  EventUpdateDTO,
  EventListParams,
} from './event.models';

@Injectable({ providedIn: 'root' })
export class EventsApiService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${environment.apiBaseUrl}/api/events`;

  /**
   * Obtiene el listado de eventos con filtros opcionales.
   * Por defecto solo devuelve eventos publicados.
   *
   * @param params Filtros opcionales (scope, juego, fechas, borradores)
   */
  list(params: EventListParams = {}): Observable<EventSummaryDTO[]> {
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
    if (params.active !== undefined) {
      httpParams = httpParams.set('active', String(params.active));
    }
    if (params.registrationOpen !== undefined) {
      httpParams = httpParams.set('registration_open', String(params.registrationOpen));
    }
    if (params.from !== undefined) {
      httpParams = httpParams.set('from', params.from);
    }
    if (params.to !== undefined) {
      httpParams = httpParams.set('to', params.to);
    }
    if (params.includeUnpublished) {
      httpParams = httpParams.set('include_unpublished', 'true');
    }

    return this.http
      .get<EventSummaryDTO[]>(this.endpoint, { params: httpParams })
      .pipe(catchError((err) => this.handleError(err)));
  }

  /**
   * Obtiene el detalle completo de un evento por ID (incluye content).
   * Los eventos no publicados requieren autenticación y permiso events.edit.
   *
   * @param id ID del evento
   */
  getById(id: number): Observable<EventDTO> {
    return this.http
      .get<EventDTO>(`${this.endpoint}/${id}`)
      .pipe(catchError((err) => this.handleError(err)));
  }

  /**
   * Crea un nuevo evento.
   * Requiere autenticación y permiso events.edit en el scope indicado.
   *
   * @param data Datos del evento a crear
   */
  create(data: EventCreateDTO): Observable<EventDTO> {
    return this.http
      .post<EventDTO>(this.endpoint, this.toSnakeCase(data as unknown as Record<string, unknown>))
      .pipe(catchError((err) => this.handleError(err)));
  }

  /**
   * Actualiza parcialmente un evento.
   * Solo se envían los campos a modificar.
   * scope_type y scope_id no son modificables.
   *
   * @param id ID del evento
   * @param data Campos a actualizar
   */
  update(id: number, data: EventUpdateDTO): Observable<EventDTO> {
    return this.http
      .patch<EventDTO>(`${this.endpoint}/${id}`, this.toSnakeCase(data as unknown as Record<string, unknown>))
      .pipe(catchError((err) => this.handleError(err)));
  }

  /**
   * Elimina un evento.
   * Requiere autenticación y permiso events.edit en el scope del evento.
   *
   * @param id ID del evento
   */
  delete(id: number): Observable<void> {
    return this.http
      .delete<void>(`${this.endpoint}/${id}`)
      .pipe(catchError((err) => this.handleError(err)));
  }

  /**
   * Convierte las claves camelCase del DTO a snake_case para el backend.
   */
  private toSnakeCase(data: Record<string, unknown>): Record<string, unknown> {
    const map: Record<string, string> = {
      scopeType: 'scope_type',
      scopeId: 'scope_id',
      gameId: 'game_id',
      startsAt: 'starts_at',
      endsAt: 'ends_at',
      countryCode: 'country_code',
      regionId: 'region_id',
      provinceName: 'province_name',
      municipalityName: 'municipality_name',
      postalCode: 'postal_code',
      streetName: 'street_name',
      streetNumber: 'street_number',
      registrationOpen: 'registration_open',
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
      return throwError(() => ({ status: 403, message: 'Sin permisos para gestionar este evento' }));
    }
    if (error.status === 404) {
      return throwError(() => ({ status: 404, message: 'Evento no encontrado' }));
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
