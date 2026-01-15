import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, catchError, switchMap, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { User } from './user.model';
import { isLaravelValidationError } from './laravel-validation-error';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = environment.apiBaseUrl;
  private csrfReady = false;

  getCsrfCookie(): Observable<void> {
    if (this.csrfReady) {
      return new Observable((observer) => {
        observer.next();
        observer.complete();
      });
    }

    return this.http.get(`${this.apiBaseUrl}/sanctum/csrf-cookie`, { responseType: 'text' }).pipe(
      tap(() => {
        this.csrfReady = true;
      }),
      catchError((error) => this.handleError(error)),
      map(() => void 0)
    );
  }

  login(username: string, password: string): Observable<User> {
    return this.getCsrfCookie().pipe(
      switchMap(() =>
        this.http
          .post<User>(`${this.apiBaseUrl}/api/auth/login`, {
            username,
            password,
          })
          .pipe(catchError((error) => this.handleError(error)))
      )
    );
  }

  me(): Observable<User> {
    return this.http
      .get<User>(`${this.apiBaseUrl}/api/auth/me`)
      .pipe(catchError((error) => this.handleError(error)));
  }

  logout(): Observable<void> {
    return this.http
      .post<void>(`${this.apiBaseUrl}/api/auth/logout`, {})
      .pipe(catchError((error) => this.handleError(error)));
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    if (error.status === 401) {
      return throwError(() => ({
        status: 401,
        message: 'No autorizado',
      }));
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
