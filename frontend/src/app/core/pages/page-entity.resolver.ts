import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { OwnableEntity } from '../context/context.models';
import { WebScope } from '../web-scope.constants';

/**
 * Resolver para determinar el contexto de propiedad (Owner) de una página pública.
 * * Es compatible con nombres de parámetros variables (:slug, :assocSlug, :id, etc.)
 * gracias a la detección por posición y estructura de URL.
 */
@Injectable({ providedIn: 'root' })
export class PageEntityResolver implements Resolve<OwnableEntity> {

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<OwnableEntity> {
    const url = state.url;

    // -----------------------------------------------------------------------
    // CASO 1: PÁGINAS DE ASOCIACIÓN
    // Ruta típica: /asociaciones/:slug/:pagina (donde :slug es la asociación)
    // -----------------------------------------------------------------------
    if (url.startsWith('/asociaciones/')) {
      // Intentamos obtener el slug de la asociación por nombre específico O genérico
      const assocSlug = route.paramMap.get('assocSlug') || route.paramMap.get('slug');

      if (assocSlug) {
        console.log(`[Resolver] Asociación detectada: ${assocSlug}`);
        // TODO: Buscar ID real en Store/API usando assocSlug
        return of({ id: 0, ownerType: WebScope.ASSOCIATION, ownerId: 99 });
      }
    }

    // -----------------------------------------------------------------------
    // CASO 2: PÁGINAS DE JUEGO
    // Ruta típica: /juegos/:slug/:pagina (donde :slug es el juego)
    // -----------------------------------------------------------------------
    if (url.startsWith('/juegos/')) {
      const gameSlug = route.paramMap.get('gameSlug') || route.paramMap.get('slug');

      if (gameSlug) {
        console.log(`[Resolver] Juego detectado: ${gameSlug}`);
        // TODO: Buscar ID real en Store/API usando gameSlug
        return of({ id: 0, ownerType: WebScope.GAME, ownerId: 50 });
      }
    }

    // -----------------------------------------------------------------------
    // CASO 3: PÁGINAS GLOBALES (Default)
    // Ruta: /paginas/:slug
    // -----------------------------------------------------------------------
    // Si no es juego ni asociación, asumimos global
    return of({
      id: 0,
      ownerType: WebScope.GLOBAL,
      ownerId: 0
    });
  }
}
