import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AssociationMemberStatus,
  AssociationMemberStatusCreateData,
  AssociationMemberStatusUpdateData,
  AssociationMemberStatusResponse
} from './member-status.models';

/**
 * Servicio para gestionar estados de miembros de asociaciones mediante API
 */
@Injectable({
  providedIn: 'root',
})
export class MemberStatusApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = environment.apiBaseUrl;

  /**
   * Obtener todos los estados
   * GET /api/association-member-statuses
   */
  getAll(associationId?: number, type?: number): Observable<AssociationMemberStatus[]> {
    let params = new HttpParams();
    if (associationId !== undefined) {
      params = params.set('association_id', associationId.toString());
    }
    if (type !== undefined) {
      params = params.set('type', type.toString());
    }

    return this.http.get<AssociationMemberStatus[]>(
      `${this.apiBaseUrl}/api/association-member-statuses`,
      { params }
    );
  }

  /**
   * Obtener un estado específico
   * GET /api/association-member-statuses/{id}
   */
  getById(id: number): Observable<AssociationMemberStatus> {
    return this.http.get<AssociationMemberStatus>(
      `${this.apiBaseUrl}/api/association-member-statuses/${id}`
    );
  }

  /**
   * Crear un nuevo estado
   * POST /api/association-member-statuses
   *
   * @returns El objeto creado directamente, o {errors: true, errorsList: {...}} si hay errores
   */
  create(data: AssociationMemberStatusCreateData): Observable<AssociationMemberStatus | AssociationMemberStatusResponse> {
    return this.http.post<AssociationMemberStatus | AssociationMemberStatusResponse>(
      `${this.apiBaseUrl}/api/association-member-statuses`,
      data
    );
  }

  /**
   * Actualizar un estado existente
   * PUT/PATCH /api/association-member-statuses/{id}
   *
   * @returns El objeto actualizado directamente, o {errors: true, errorsList: {...}} si hay errores
   */
  update(id: number, data: AssociationMemberStatusUpdateData): Observable<AssociationMemberStatus | AssociationMemberStatusResponse> {
    return this.http.patch<AssociationMemberStatus | AssociationMemberStatusResponse>(
      `${this.apiBaseUrl}/api/association-member-statuses/${id}`,
      data
    );
  }

  /**
   * Eliminar un estado
   * DELETE /api/association-member-statuses/{id}
   */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiBaseUrl}/api/association-member-statuses/${id}`
    );
  }
}
