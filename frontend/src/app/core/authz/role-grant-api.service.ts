/**
 * Servicio para gestión de asignaciones de roles (role grants).
 *
 * Requiere autenticación y rol de administrador.
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RoleGrant, RoleGrantCreateRequest, RoleGrantUpdateRequest } from './role-grant.models';

@Injectable({
  providedIn: 'root'
})
export class RoleGrantApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/role-grants`;

  /**
   * Listar todas las asignaciones de roles.
   * @param userId - Filtrar por usuario específico (opcional)
   * @param userIds - Filtrar por múltiples usuarios (opcional)
   */
  getAll(userId?: number, userIds?: number[]): Observable<RoleGrant[]> {
    let params = new HttpParams();

    if (userId) {
      params = params.set('user_id', userId.toString());
    }

    if (userIds && userIds.length > 0) {
      params = params.set('user_ids', userIds.join(','));
    }

    return this.http.get<RoleGrant[]>(this.baseUrl, { params });
  }

  /**
   * Obtener una asignación de rol específica.
   */
  getById(id: number): Observable<RoleGrant> {
    return this.http.get<RoleGrant>(`${this.baseUrl}/${id}`);
  }

  /**
   * Crear una nueva asignación de rol.
   */
  create(data: RoleGrantCreateRequest): Observable<RoleGrant> {
    return this.http.post<RoleGrant>(this.baseUrl, data);
  }

  /**
   * Actualizar una asignación de rol existente.
   */
  update(id: number, data: RoleGrantUpdateRequest): Observable<RoleGrant> {
    return this.http.put<RoleGrant>(`${this.baseUrl}/${id}`, data);
  }

  /**
   * Eliminar una asignación de rol.
   */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
