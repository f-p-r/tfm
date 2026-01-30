import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Association } from './associations.models';

/**
 * Servicio HTTP para la API de asociaciones.
 */
@Injectable({ providedIn: 'root' })
export class AssociationsApiService {
  private readonly http = inject(HttpClient);

  /**
   * Obtiene una asociación por su slug.
   *
   * @param slug Slug de la asociación (será URL-encoded automáticamente).
   * @returns Observable con los datos de la asociación.
   * @throws 404 si no existe o está deshabilitada.
   */
  getBySlug(slug: string): Observable<Association> {
    return this.http.get<Association>(`/api/associations/by-slug/${encodeURIComponent(slug)}`);
  }
}
