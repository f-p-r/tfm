/**
 * Servicio API para consultar permisos efectivos contra el backend.
 * Endpoint: POST /api/authz/query
 *
 * Ejemplo de uso:
 * ```
 * import { WebScope } from '@/core/web-scope.constants';
 * import { AuthzApiService } from '@/core/authz/authz-api.service';
 *
 * constructor(private authz = inject(AuthzApiService)) {}
 *
 * consultar() {
 *   this.authz.query({
 *     scopeType: WebScope.ASSOCIATION,
 *     scopeIds: [123, 456],
 *     permissions: ['news.create', 'news.edit'],
 *     breakdown: true
 *   }).subscribe(res => console.log(res));
 * }
 * ```
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthzQueryRequest, AuthzQueryResponse } from './authz.models';

@Injectable({ providedIn: 'root' })
export class AuthzApiService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${environment.apiBaseUrl}/api/authz/query`;

  /**
   * Consulta permisos efectivos del usuario para un alcance y lista de permisos.
   *
   * Normaliza la solicitud antes de enviar:
   * - scopeIds y permissions se ordenan para consistencia.
   * - Se aseguran arrays vacíos en lugar de undefined.
   *
   * @param req Solicitud con scopeType, scopeIds, permissions y breakdown.
   * @returns Observable con la respuesta tipada (resumen o desglose).
   */
  query(req: AuthzQueryRequest): Observable<AuthzQueryResponse> {
    const normalizedReq = this.normalizeRequest(req);
    return this.http.post<AuthzQueryResponse>(this.endpoint, normalizedReq);
  }

  /**
   * Normaliza la solicitud para asegurar consistencia:
   * - scopeIds ordenados numéricamente (asc).
   * - permissions ordenadas alfabéticamente (asc).
   * - Arrays vacíos si no se proporcionan.
   *
   * @param req Solicitud sin normalizar.
   * @returns Solicitud normalizada.
   */
  private normalizeRequest(req: AuthzQueryRequest): AuthzQueryRequest {
    return {
      scopeType: req.scopeType,
      scopeIds: (req.scopeIds ?? []).slice().sort((a, b) => a - b),
      permissions: (req.permissions ?? []).slice().sort(),
      breakdown: req.breakdown,
    };
  }
}
