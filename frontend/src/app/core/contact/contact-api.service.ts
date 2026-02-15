import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ContactInfo,
  CreateContactInfo,
  UpdateContactInfo,
  ContactInfoQueryParams,
  ContactInfoErrorResponse,
} from './contact.models';

/**
 * Servicio para gestionar información de contacto mediante la API.
 *
 * Endpoints:
 * - GET /api/contact-info - Listar con filtros
 * - GET /api/contact-info/{id} - Obtener uno
 * - POST /api/contact-info - Crear
 * - PUT/PATCH /api/contact-info/{id} - Actualizar
 * - DELETE /api/contact-info/{id} - Eliminar
 */
@Injectable({ providedIn: 'root' })
export class ContactApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/contact-info`;

  /**
   * Listar contactos con filtros opcionales.
   *
   * @param params Parámetros de filtrado
   * @returns Observable con array de contactos
   */
  getAll(params?: ContactInfoQueryParams): Observable<ContactInfo[]> {
    let httpParams = new HttpParams();

    if (params) {
      if (params.owner_type !== undefined) {
        httpParams = httpParams.set('owner_type', params.owner_type.toString());
      }
      if (params.owner_id !== undefined) {
        httpParams = httpParams.set('owner_id', params.owner_id.toString());
      }
      if (params.contact_type) {
        httpParams = httpParams.set('contact_type', params.contact_type);
      }
      if (params.category) {
        httpParams = httpParams.set('category', params.category);
      }
      if (params.include_private) {
        httpParams = httpParams.set('include_private', 'true');
      }
    }

    return this.http.get<ContactInfo[]>(this.baseUrl, { params: httpParams });
  }

  /**
   * Obtener un contacto específico por ID.
   *
   * @param id ID del contacto
   * @returns Observable con el contacto
   */
  getById(id: number): Observable<ContactInfo> {
    return this.http.get<ContactInfo>(`${this.baseUrl}/${id}`);
  }

  /**
   * Crear nuevo contacto.
   *
   * @param data Datos del contacto a crear
   * @returns Observable con el contacto creado o error de validación
   */
  create(data: CreateContactInfo): Observable<ContactInfo | ContactInfoErrorResponse> {
    return this.http.post<ContactInfo | ContactInfoErrorResponse>(this.baseUrl, data);
  }

  /**
   * Actualizar contacto existente.
   *
   * @param id ID del contacto a actualizar
   * @param data Datos a actualizar (parcial)
   * @returns Observable con el contacto actualizado o error
   */
  update(id: number, data: UpdateContactInfo): Observable<ContactInfo | ContactInfoErrorResponse> {
    return this.http.put<ContactInfo | ContactInfoErrorResponse>(`${this.baseUrl}/${id}`, data);
  }

  /**
   * Eliminar contacto.
   *
   * @param id ID del contacto a eliminar
   * @returns Observable vacío (204 No Content)
   */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  /**
   * Obtener contactos de una asociación específica.
   *
   * @param associationId ID de la asociación
   * @param includePrivate Incluir contactos privados (requiere autenticación)
   * @returns Observable con contactos de la asociación
   */
  getByAssociation(associationId: number, includePrivate = false): Observable<ContactInfo[]> {
    return this.getAll({
      owner_type: 2, // ASSOCIATION
      owner_id: associationId,
      include_private: includePrivate,
    });
  }

  /**
   * Obtener contactos globales (Naipeando).
   *
   * @param includePrivate Incluir contactos privados
   * @returns Observable con contactos globales
   */
  getGlobal(includePrivate = false): Observable<ContactInfo[]> {
    return this.getAll({
      owner_type: 1, // GLOBAL
      owner_id: undefined,
      include_private: includePrivate,
    });
  }

  /**
   * Obtener contactos de un juego específico.
   *
   * @param gameId ID del juego
   * @param includePrivate Incluir contactos privados
   * @returns Observable con contactos del juego
   */
  getByGame(gameId: number, includePrivate = false): Observable<ContactInfo[]> {
    return this.getAll({
      owner_type: 3, // GAME
      owner_id: gameId,
      include_private: includePrivate,
    });
  }
}
