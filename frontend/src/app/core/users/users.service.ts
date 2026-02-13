import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../auth/user.model';

export interface UserCreateData {
  name: string;
  username: string;
  email: string;
  password: string;
}

export interface UserUpdateData {
  name?: string;
  email?: string;
  password?: string;
}

export interface UserResponse {
  errors: boolean;
  data?: User;
  errorsList?: Record<string, string>;
}

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = environment.apiBaseUrl;

  /**
   * Crear un nuevo usuario (registro público)
   * POST /api/users
   */
  create(data: UserCreateData): Observable<UserResponse> {
    return this.http.post<UserResponse>(`${this.apiBaseUrl}/api/users`, data);
  }

  /**
   * Obtener un usuario específico
   * GET /api/users/{id}
   */
  getById(id: number): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.apiBaseUrl}/api/users/${id}`);
  }

  /**
   * Actualizar datos del usuario (parcial)
   * PATCH /api/users/{id}
   */
  update(id: number, data: UserUpdateData): Observable<UserResponse> {
    return this.http.patch<UserResponse>(`${this.apiBaseUrl}/api/users/${id}`, data);
  }
}
