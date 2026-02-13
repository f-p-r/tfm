/**
 * Guard que resuelve el scope de contexto ANTES de validar permisos.
 *
 * Problema:
 * Los guards se ejecutan antes de NavigationEnd, por lo que PermissionsStore
 * validaría con el scope ANTIGUO si no actualizamos ContextStore primero.
 *
 * Solución:
 * Este guard analiza la URL de destino, determina el scope correcto,
 * actualiza ContextStore y espera a que los permisos se recarguen.
 * Debe ejecutarse ANTES de requirePermission en canActivate.
 *
 * @example
 * ```typescript
 * // En app.routes.ts - rutas GLOBAL
 * {
 *   path: 'admin',
 *   component: AdminPage,
 *   canActivate: [resolveScopeGuard, requirePermission('admin')]
 * }
 *
 * // En rutas con scope específico, usar guards dedicados (gameBySlugGuard, etc)
 * {
 *   path: 'juegos/:slug',
 *   component: GamePage,
 *   canActivate: [gameBySlugGuard] // Ya resuelve scope internamente
 * }
 * ```
 */

import { inject } from '@angular/core';
import { CanActivateFn, ActivatedRouteSnapshot, Router } from '@angular/router';
import { ContextStore } from '../core/context/context.store';
import { PermissionsStore } from '../core/authz/permissions.store';
import { GamesStore } from '../core/games/games.store';
import { AssociationsResolveService } from '../core/associations/associations-resolve.service';
import { WebScope } from '../core/web-scope.constants';
import { map, catchError, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

/**
 * Guard funcional que resuelve el scope de contexto antes de continuar.
 *
 * Lógica de resolución:
 * 1. Si route.data['entity'] existe → usa entity.ownerType y entity.ownerId
 * 2. Si URL comienza con /asociaciones/:slug → resuelve asociación
 * 3. Si URL comienza con /juegos/:slug → resuelve juego
 * 4. Fallback → establece scope GLOBAL
 *
 * Después de determinar el scope:
 * - Actualiza ContextStore (dispara recarga de permisos automáticamente)
 * - Espera a que los permisos terminen de cargarse
 * - Devuelve true para continuar con los siguientes guards
 */
export const resolveScopeGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const contextStore = inject(ContextStore);
  const permissionsStore = inject(PermissionsStore);
  const gamesStore = inject(GamesStore);
  const associationsResolve = inject(AssociationsResolveService);
  const router = inject(Router);

  const url = router.url;
  const data = route.data;
  const params = route.params;

  // Prioridad 1: Entity desde resolver
  if (data['entity']) {
    const entity = data['entity'];
    const scopeType = entity.ownerType;
    const scopeId = entity.ownerId === 0 ? null : entity.ownerId;

    console.log(`🎯 [resolveScopeGuard] Detectada entity → Scope ${scopeType}:${scopeId}`);
    contextStore.setScope(scopeType, scopeId, 'router');

    return permissionsStore.waitForLoad().pipe(map(() => true));
  }

  // Prioridad 2: Parámetros ownerType/ownerId en la URL (ej: /admin/pages/:ownerType/:ownerId)
  const ownerTypeParam = params['ownerType'];
  const ownerIdParam = params['ownerId'];

  if (ownerTypeParam && ownerIdParam) {
    const ownerType = parseInt(ownerTypeParam, 10);
    const ownerId = parseInt(ownerIdParam, 10);

    if (!isNaN(ownerType) && !isNaN(ownerId)) {
      const scopeId = ownerId === 0 ? null : ownerId;
      console.log(`🎯 [resolveScopeGuard] Detectados ownerType/ownerId → Scope ${ownerType}:${scopeId}`);
      contextStore.setScope(ownerType, scopeId, 'router');

      return permissionsStore.waitForLoad().pipe(map(() => true));
    }
  }

  // Prioridad 3: URL de asociación
  const assocSlug = url.startsWith('/asociaciones/') ? (params['slug'] || params['assocSlug']) : undefined;

  if (assocSlug) {
    console.log(`🎯 [resolveScopeGuard] Detectada ruta de asociación: ${assocSlug}`);

    return associationsResolve.resolveBySlug(assocSlug).pipe(
      map(association => {
        contextStore.setScope(WebScope.ASSOCIATION, association.id, 'router');
        console.log(`✅ [resolveScopeGuard] Asociación resuelta → Scope ${WebScope.ASSOCIATION}:${association.id}`);
      }),
      switchMap(() => permissionsStore.waitForLoad()),
      map(() => true),
      catchError(() => {
        console.warn(`⚠️ [resolveScopeGuard] Asociación no encontrada: ${assocSlug} → Scope GLOBAL`);
        contextStore.setGlobal('router');
        return permissionsStore.waitForLoad().pipe(map(() => true));
      })
    );
  }

  // Prioridad 4: URL de juego
  const gameSlug = url.startsWith('/juegos/') ? (params['slug'] || params['gameSlug']) : undefined;

  if (gameSlug) {
    console.log(`🎯 [resolveScopeGuard] Detectada ruta de juego: ${gameSlug}`);

    // Usar loadOnce() para aprovechar caché (TTL 5 min) o cargar si es necesario
    return gamesStore.loadOnce().pipe(
      map(() => {
        const games = gamesStore.sortedGames();
        const game = games.find(g => g.slug === gameSlug);

        if (game) {
          contextStore.setScope(WebScope.GAME, game.id, 'router');
          console.log(`✅ [resolveScopeGuard] Juego resuelto → Scope ${WebScope.GAME}:${game.id}`);
        } else {
          console.warn(`⚠️ [resolveScopeGuard] Juego no encontrado: ${gameSlug} → Scope GLOBAL`);
          contextStore.setGlobal('router');
        }
      }),
      switchMap(() => permissionsStore.waitForLoad()),
      map(() => true),
      catchError(() => {
        console.warn(`⚠️ [resolveScopeGuard] Error cargando juegos → Scope GLOBAL`);
        contextStore.setGlobal('router');
        return permissionsStore.waitForLoad().pipe(map(() => true));
      })
    );
  }

  // Fallback: Scope GLOBAL (para /admin, /perfil, /login, etc)
  console.log(`🎯 [resolveScopeGuard] Ruta sin scope específico → Scope GLOBAL`);
  contextStore.setGlobal('router');

  return permissionsStore.waitForLoad().pipe(map(() => true));
};
