import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection, inject, provideAppInitializer} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { AuthService } from './core/auth/auth.service';

import { routes } from './app.routes';
import { credentialsInterceptor } from './core/interceptors/credentials.interceptor';
import { xsrfInterceptor } from './core/interceptors/xsrf.interceptor';
import { Observable } from 'rxjs';


// Función factoría que ejecuta la comprobación de sesión
function initializeAppData(authService: AuthService): () => Observable<void> {
  return () => authService.checkSession();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([credentialsInterceptor, xsrfInterceptor])
    ),
    // --- BLOQUE DE INICIALIZACIÓN ---
    // Angular esperará a que checkSession() termine antes de pintar la web.
    provideAppInitializer(() => {
        const authService = inject(AuthService);
        return authService.checkSession();
    }),

  ]
};
