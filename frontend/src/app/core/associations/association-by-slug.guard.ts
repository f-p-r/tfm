import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot } from '@angular/router';
import { map, catchError, of } from 'rxjs';
import { AssociationsResolveService } from './associations-resolve.service';
import { ContextStore } from '../context/context.store';
import { WebScope } from '../web-scope.constants';
import { slugify } from '../../shared/utils/slugify';

/**
 * Guard para rutas de asociaciones individuales (/asociaciones/:slug).
 *
 * Funcionalidad:
 * - Resuelve la asociación por slug usando AssociationsResolveService
 * - Actualiza ContextStore con el ID de la asociación
 * - Canonicaliza la URL si el slug no coincide exactamente
 * - Redirige a Home si la asociación no existe (404)
 */
export const associationBySlugGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const router = inject(Router);
  const contextStore = inject(ContextStore);
  const resolveService = inject(AssociationsResolveService);

  const paramSlug = route.paramMap.get('slug');

  // Si no hay slug en la URL, redirigir a Home
  if (!paramSlug) {
    contextStore.setGlobal('router');
    router.navigateByUrl('/', { replaceUrl: true });
    return false;
  }

  // Marcar contexto como pendiente (tipo conocido, ID aún no)
  contextStore.setScope(WebScope.ASSOCIATION, null, 'router');

  // Resolver asociación por slug
  return resolveService.resolveBySlug(paramSlug).pipe(
    map((association) => {
      // Actualizar contexto con el ID de la asociación
      contextStore.setScope(WebScope.ASSOCIATION, association.id, 'router');

      // Canonicalización: si el slug en la URL no coincide con el slug real, redirigir
      if (paramSlug !== association.slug) {
        router.navigate(['/asociaciones', association.slug], { replaceUrl: true });
        return false;
      }

      return true;
    }),
    catchError(() => {
      // Error 404 u otro: redirigir a Home
      contextStore.setGlobal('router');
      router.navigateByUrl('/', { replaceUrl: true });
      return of(false);
    })
  );
};
