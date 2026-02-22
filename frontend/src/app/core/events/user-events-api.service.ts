/**
 * Servicio API para asistencias de usuarios a eventos.
 *
 * Encapsula las llamadas a /api/user-events:
 *  - POST  → solicitar inscripción (usuario)
 *  - GET   → listar inscripciones de un evento (admin)
 *  - PATCH → cambiar estado (admin)
 */
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

/** Respuesta completa de una asistencia (incluye usuario y tipo de estado) */
export interface UserEventDTO {
  id: number;
  userId: number;
  eventId: number;
  status: 1 | 2 | 3;
  statusDate: string;
  createdAt: string;
  updatedAt: string;
  user: { id: number; username: string; name: string; email?: string };
  statusType: { id: number; name: string };
}

@Injectable({ providedIn: 'root' })
export class UserEventsApiService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${environment.apiBaseUrl}/api/user-events`;

  /**
   * Crea una solicitud de asistencia al evento indicado.
   * El status se fuerza a 1 (Solicitud pendiente) en el backend.
   */
  requestAttendance(userId: number, eventId: number): Observable<UserEventDTO> {
    return this.http
      .post<UserEventDTO>(this.endpoint, { user_id: userId, event_id: eventId })
      .pipe(catchError((err) => this.handleError(err)));
  }

  /**
   * Devuelve todas las inscripciones de un evento (uso admin).
   */
  getByEvent(eventId: number): Observable<UserEventDTO[]> {
    const params = new HttpParams().set('event_id', eventId);
    return this.http
      .get<UserEventDTO[]>(this.endpoint, { params })
      .pipe(catchError((err) => this.handleError(err)));
  }

  /**
   * Actualiza el estado de una inscripción (uso admin).
   * @param id  ID de la asistencia
   * @param status  Nuevo estado: 1 | 2 | 3
   */
  updateStatus(id: number, status: 1 | 2 | 3): Observable<UserEventDTO> {
    return this.http
      .patch<UserEventDTO>(`${this.endpoint}/${id}`, { status })
      .pipe(catchError((err) => this.handleError(err)));
  }

  private handleError(err: HttpErrorResponse): Observable<never> {
    return throwError(() => err);
  }
}
