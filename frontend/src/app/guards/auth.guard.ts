import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../core/auth/auth.service';

/**
 * Guard para rutas que requieren autenticación.
 * Redirige a /login si el usuario no está autenticado.
 */
export const requireAuth: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};
