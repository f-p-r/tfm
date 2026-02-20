import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../core/auth/auth.service';

/**
 * Guard para rutas que requieren autenticación.
 * Redirige a /login con returnUrl si el usuario no está autenticado.
 */
export const requireAuth: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  // Redirigir a login con la URL actual como returnUrl
  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url }
  });
};
