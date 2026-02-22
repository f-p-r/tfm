/**
 * Servicio API para asistencias de usuarios a eventos.
 *
 * Encapsula la llamada POST /api/user-events (solicitar inscripción).
 * La gestión de estado (aprobar/rechazar) se hace desde el panel de admin.
 */
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { EventAttendanceDTO } from './event.models';

/** Respuesta completa de una asistencia */
export interface UserEventDTO {
  id: number;
  userId: number;
  eventId: number;
  status: 1 | 2 | 3;
  statusDate: string;
  createdAt: string;
  updatedAt: string;
  statusType: { id: number; name: string };
}

@Injectable({ providedIn: 'root' })
export class UserEventsApiService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${environment.apiBaseUrl}/api/user-events`;

  /**
   * Crea una solicitud de asistencia al evento indicado.
   * El status se fuerza a 1 (Solicitud pendiente) en el backend.
   *
   * @param userId ID del usuario autenticado
   * @param eventId ID del evento
   */
  requestAttendance(userId: number, eventId: number): Observable<UserEventDTO> {
    return this.http
      .post<UserEventDTO>(this.endpoint, { user_id: userId, event_id: eventId })
      .pipe(catchError((err) => this.handleError(err)));
  }

  private handleError(err: HttpErrorResponse): Observable<never> {
    return throwError(() => err);
  }
}
