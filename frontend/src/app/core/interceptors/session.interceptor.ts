import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { AuthzService } from '../authz/authz.service';
import { environment } from '../../../environments/environment';

/**
 * URLs de autenticación que deben ignorarse aunque devuelvan 401.
 * - /api/auth/me → se llama durante checkSession(), un 401 ahí es el flujo normal
 * - /api/auth/login → credenciales incorrectas, no es caducidad de sesión
 * - /sanctum/csrf-cookie → no requiere autenticación
 */
const SKIP_URLS = [
  '/api/auth/me',
  '/api/auth/login',
  '/sanctum/csrf-cookie',
];

/**
 * Interceptor global que detecta respuestas 401 del backend y limpia el estado
 * de autenticación del frontend para mantener la coherencia.
 *
 * Cuando la sesión de cookie caduca en el backend, cualquier request autenticado
 * devuelve 401. Este interceptor lo captura y:
 * 1. Pone currentUser a null → el effect de PermissionsStore limpia permisos automáticamente
 * 2. Limpia la caché de AuthzService → evita que permisos obsoletos sirvan desde caché
 *
 * El error se re-lanza para que los servicios individuales puedan seguir manejándolo.
 */
export const sessionInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const authzService = inject(AuthzService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        const isSkipped = SKIP_URLS.some((url) => req.url.includes(url));

        if (!isSkipped && authService.currentUser() !== null) {
          console.warn('[SessionInterceptor] 401 detectado — limpiando sesión frontend');
          authService.currentUser.set(null);
          authzService.clearCache();
          // PermissionsStore se limpia automáticamente vía su effect en currentUser
        }
      }

      return throwError(() => error);
    })
  );
};
