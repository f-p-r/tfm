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
}
