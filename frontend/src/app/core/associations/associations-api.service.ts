import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Association } from './associations.models';
import { environment } from '../../../environments/environment';

/**
 * Servicio HTTP para la API de asociaciones.
 */
@Injectable({ providedIn: 'root' })
export class AssociationsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/associations`;

  /**
   * Obtiene todas las asociaciones.
   *
   * @param includeDisabled Incluir asociaciones deshabilitadas (default: false).
   * @returns Observable con el array de asociaciones.
   */
  getAll(includeDisabled = false): Observable<Association[]> {
    if (includeDisabled) {
      return this.http.get<Association[]>(this.baseUrl, {
        params: { include_disabled: 'true' }
      });
    }
    return this.http.get<Association[]>(this.baseUrl);
  }

  /**
   * Obtiene una asociación por su ID.
   *
   * @param id ID de la asociación.
   * @returns Observable con los datos de la asociación.
   * @throws 404 si no existe.
   */
  getById(id: number): Observable<Association> {
    return this.http.get<Association>(`${this.baseUrl}/${id}`);
  }

  /**
   * Obtiene una asociación por su slug.
   *
   * @param slug Slug de la asociación (será URL-encoded automáticamente).
   * @returns Observable con los datos de la asociación.
   * @throws 404 si no existe o está deshabilitada.
   */
  getBySlug(slug: string): Observable<Association> {
    return this.http.get<Association>(`${this.baseUrl}/by-slug/${encodeURIComponent(slug)}`);
  }

  /**
   * Crea una nueva asociación.
   *
   * @param data Datos de la asociación. Los campos requeridos son name y slug.
   * @returns Observable con la asociación creada.
   * @throws 422 si hay errores de validación.
   */
  create(data: Partial<Association>): Observable<Association> {
    return this.http.post<Association>(this.baseUrl, data);
  }

  /**
   * Actualiza una asociación existente.
   *
   * @param id ID de la asociación.
   * @param data Datos a actualizar. Todos los campos son opcionales.
   * @returns Observable con la asociación actualizada.
   * @throws 404 si no existe.
   * @throws 422 si hay errores de validación.
   */
  update(id: number, data: Partial<Association>): Observable<Association> {
    return this.http.put<Association>(`${this.baseUrl}/${id}`, data);
  }
}
