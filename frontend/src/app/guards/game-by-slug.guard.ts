/**
 * Guard funcional para rutas de juegos basadas en slug.
 *
 * Flujo:
 * 1. Lee el slug de la URL (/juegos/:slug)
 * 2. Normaliza el slug usando slugify (para tolerar mayúsculas/acentos)
 * 3. Carga los juegos si es necesario
 * 4. Busca el juego por slug normalizado
 * 5. Si no existe: marca contexto global y redirige a Home
 * 6. Si existe: actualiza contexto con GAME y el ID del juego
 * 7. Canonicaliza el slug si no coincide exactamente (replaceUrl)
 *
 * Retorna:
 * - false: Si hay error, no se encuentra el juego, o se redirige
 * - true: Si el juego existe y el acceso es válido
 */

import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { GamesStore } from '../core/games/games.store';
import { ContextStore } from '../core/context/context.store';
import { WebScope } from '../core/web-scope.constants';
import { slugify } from '../shared/utils/slugify';

export const gameBySlugGuard: CanActivateFn = (route) => {
  const router = inject(Router);
  const gamesStore = inject(GamesStore);
  const contextStore = inject(ContextStore);

  const slugParam = route.paramMap.get('slug');

  // Si no hay slug, redirigir a Home
  if (!slugParam) {
    contextStore.setGlobal('router');
    router.navigateByUrl('/', { replaceUrl: true });
    return of(false);
  }

  // Normalizar el slug para tolerar mayúsculas/acentos
  const normalizedSlug = slugify(slugParam);

  // Marcar contexto como GAME pendiente (sin ID aún)
  contextStore.setScope(WebScope.GAME, null, 'router');

  // Cargar juegos y resolver
  return gamesStore.loadOnce().pipe(
    map(() => {
      const game = gamesStore.getBySlug(normalizedSlug);

      // Si el juego no existe, marcar global y redirigir a Home
      if (!game) {
        contextStore.setGlobal('router');
        router.navigateByUrl('/', { replaceUrl: true });
        return false;
      }

      // Actualizar contexto con el ID del juego
      contextStore.setScope(WebScope.GAME, game.id, 'router');

      // Canonicalización del slug: si no coincide exactamente, redirigir
      if (slugParam !== game.slug) {
        router.navigate(['/juegos', game.slug], { replaceUrl: true });
        return false;
      }

      // Todo OK, permitir acceso
      return true;
    }),
    catchError(() => {
      // En caso de error, marcar global y redirigir a Home
      contextStore.setGlobal('router');
      router.navigateByUrl('/', { replaceUrl: true });
      return of(false);
    })
  );
};
