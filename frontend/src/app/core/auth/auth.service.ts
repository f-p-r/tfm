import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { tap, catchError, switchMap, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { User } from './user.model';
import { isLaravelValidationError } from './laravel-validation-error';

interface AuthResponse {
  user: User;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = environment.apiBaseUrl;
  private csrfReady = false;

  // 1. ESTADO REACTIVO (Memoria del servicio)
  // Inicializamos en null (no sabemos si hay usuario)
  readonly currentUser = signal<User | null>(null);

  // Computed para que otros servicios sepan si estamos logados
  readonly isAuthenticated = computed(() => !!this.currentUser());

  /**
   * MÉTODO CRÍTICO: Comprueba si hay sesión activa al arrancar.
   * Si falla (401), captura el error para que la app arranque igual (como invitado).
   */
  checkSession(): Observable<void> {
    return this.me().pipe(
      tap((user) => {
        // Si la petición va bien, guardamos el usuario
        this.currentUser.set(user);
      }),
      catchError(() => {
        // Si falla (no hay cookie o expiró), nos aseguramos de estar limpios
        this.currentUser.set(null);
        return of(void 0); // Retornamos "nada" pero sin error
      }),
      map(() => void 0)
    );
  }

  getCsrfCookie(): Observable<void> {
    if (this.csrfReady) {
      return of(void 0);
    }
    return this.http.get(`${this.apiBaseUrl}/sanctum/csrf-cookie`, { responseType: 'text' }).pipe(
      tap(() => { this.csrfReady = true; }),
      catchError((error) => this.handleError(error)),
      map(() => void 0)
    );
  }

  login(username: string, password: string): Observable<User> {
    return this.getCsrfCookie().pipe(
      switchMap(() =>
        this.http.post<User>(`${this.apiBaseUrl}/api/auth/login`, { username, password })
          .pipe(
            // Al hacer login explícito, guardamos el usuario
            tap(user => this.currentUser.set(user)),
            catchError((error) => this.handleError(error))
          )
      )
    );
  }

  /**
   * OJO: He añadido el mapeo .pipe(map(r => r.user)) porque tu API
   * devuelve { "user": { ... } } según me dijiste.
   */
  me(): Observable<User> {
    return this.http
      .get<AuthResponse>(`${this.apiBaseUrl}/api/auth/me`)
      .pipe(
        map(response => response.user),
        catchError((error) => this.handleError(error))
      );
  }

  logout(): Observable<void> {
    return this.http
      .post<void>(`${this.apiBaseUrl}/api/auth/logout`, {})
      .pipe(
        // Al salir, limpiamos la señal
        tap(() => this.currentUser.set(null)),
        catchError((error) => this.handleError(error))
      );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    if (error.status === 401) {
      return throwError(() => ({ status: 401, message: 'No autorizado' }));
    }
    if (error.status === 422 && isLaravelValidationError(error.error)) {
      return throwError(() => ({
        status: 422,
        message: error.error.message || 'Error de validación',
        errors: error.error.errors || {},
      }));
    }
    return throwError(() => ({
      status: error.status,
      message: error.message || 'Error del servidor',
    }));
  }
}
