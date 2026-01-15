import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap, catchError, finalize, map } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { User } from './user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthStore {
  private readonly authService = inject(AuthService);

  readonly user = signal<User | null>(null);
  readonly isAuthenticated = computed(() => !!this.user());
  readonly isLoading = signal(false);

  loadMe(): Observable<void> {
    this.isLoading.set(true);

    return this.authService.me().pipe(
      tap((user) => this.setUser(user)),
      catchError((error) => {
        if (error.status === 401) {
          this.clear();
        } else {
          // Otros errores no afectan el estado actual
          console.warn('Error al cargar usuario:', error);
        }
        return of(void 0);
      }),
      finalize(() => this.isLoading.set(false)),
      map(() => void 0)
    );
  }

  setUser(user: User): void {
    this.user.set(user);
  }

  clear(): void {
    this.user.set(null);
    this.isLoading.set(false);
  }
}
