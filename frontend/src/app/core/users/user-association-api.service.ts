import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserAssociation } from './user-association.models';
import { environment } from '../../../environments/environment';

/**
 * Servicio HTTP para la API de membresías de usuarios en asociaciones.
 */
@Injectable({ providedIn: 'root' })
export class UserAssociationApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/user-associations`;

  /**
   * Obtiene todas las membresías con filtros opcionales.
   *
   * @param filters Filtros opcionales (user_id, association_id, status_id)
   * @returns Observable con el array de membresías.
   */
  getAll(filters?: {
    user_id?: number;
    association_id?: number;
    status_id?: number;
  }): Observable<UserAssociation[]> {
    let params = new HttpParams();

    if (filters?.user_id) {
      params = params.set('user_id', filters.user_id.toString());
    }
    if (filters?.association_id) {
      params = params.set('association_id', filters.association_id.toString());
    }
    if (filters?.status_id) {
      params = params.set('status_id', filters.status_id.toString());
    }

    return this.http.get<UserAssociation[]>(this.baseUrl, { params });
  }

  /**
   * Obtiene una membresía por su ID.
   *
   * @param id ID de la membresía.
   * @returns Observable con los datos de la membresía.
   */
  getById(id: number): Observable<UserAssociation> {
    return this.http.get<UserAssociation>(`${this.baseUrl}/${id}`);
  }

  /**
   * Crea una nueva membresía (solicitud de ingreso a asociación).
   *
   * @param data Datos de la membresía a crear.
   * @returns Observable con la membresía creada.
   */
  create(data: {
    user_id: number;
    association_id: number;
    association_user_id?: string;
    joined_at?: string;
    status_id?: number;
  }): Observable<UserAssociation> {
    return this.http.post<UserAssociation>(this.baseUrl, data);
  }
}
