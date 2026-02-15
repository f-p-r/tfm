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
 * Lógica de resolución (por orden de prioridad):
 * 1. Si route.data['entity'] existe → usa entity.ownerType y entity.ownerId
 * 1.5. Si URL es /admin/pages/{scopeType} sin ownerId → verifica scope actual coincida
 * 2. Si hay parámetros ownerType/ownerId → establece ese scope (ej: /admin/pages/2/5)
 * 3. Si URL comienza con /asociaciones/:slug → resuelve asociación
 * 4. Si URL comienza con /juegos/:slug → resuelve juego
 * 5. Si URL es /admin/{scopeType}/* → verifica que scope actual coincida, sino redirect a /
 * 6. Si URL es /admin raíz → preserva scope actual si existe
 * 7. Fallback → establece scope GLOBAL
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

  // IMPORTANTE: Construir la URL destino desde el route, no usar router.url
  // router.url devuelve la URL actual (antes de navegar), no la destino
  const urlSegments = route.pathFromRoot
    .map(r => r.url.map(segment => segment.path))
    .reduce((acc, segments) => acc.concat(segments), [])
    .filter(segment => segment);
  const url = '/' + urlSegments.join('/');

  const data = route.data;
  const params = route.params;

  console.log(`🎯 [resolveScopeGuard] ============================================`);
  console.log(`🎯 [resolveScopeGuard] URL DESTINO: "${url}"`);
  console.log(`🎯 [resolveScopeGuard] router.url (anterior): "${router.url}"`);
  console.log(`🎯 [resolveScopeGuard] Scope actual ANTES: ${contextStore.scopeType()}:${contextStore.scopeId()}`);
  console.log(`🎯 [resolveScopeGuard] ============================================`);

  // Prioridad 1: Entity desde resolver
  if (data['entity']) {
    const entity = data['entity'];
    const scopeType = entity.ownerType;
    const scopeId = entity.ownerId === 0 ? null : entity.ownerId;

    console.log(`🎯 [resolveScopeGuard] Detectada entity → Scope ${scopeType}:${scopeId}`);
    contextStore.setScope(scopeType, scopeId, 'router');

    return permissionsStore.waitForLoad().pipe(map(() => true));
  }

  // Prioridad 1.5: Rutas /admin/pages/{scopeType} contextuales (sin ownerId explícito)
  // Ejemplo: /admin/pages/2, /admin/pages/3/create, /admin/pages/3/edit/10
  // Verifican que el scope actual coincida con el scopeType de la URL
  const pagesContextMatch = url.match(/^\/admin\/pages\/(\d+)/);

  if (pagesContextMatch && !params['ownerId']) {
    const urlScopeType = parseInt(pagesContextMatch[1], 10);

    // Solo para scopes contextuales (> 1: asociaciones y juegos)
    if (urlScopeType > 1) {
      const currentScopeType = contextStore.scopeType();
      const currentScopeId = contextStore.scopeId();

      console.log(`🎯 [resolveScopeGuard] Ruta /admin/pages/${urlScopeType} contextual → Verificando scope actual ${currentScopeType}:${currentScopeId}`);

      // Verificar que el scope actual coincide con la URL y tiene scopeId definido
      if (currentScopeType === urlScopeType && currentScopeId !== null && currentScopeId !== undefined) {
        console.log(`✅ [resolveScopeGuard] Scope coincide → Manteniendo ${currentScopeType}:${currentScopeId}`);
        return permissionsStore.waitForLoad().pipe(map(() => true));
      } else {
        console.warn(`⚠️ [resolveScopeGuard] Scope no coincide o sin scopeId → Redirect a /`);
        router.navigateByUrl('/');
        return of(false);
      }
    }
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
/****** @@@ borrar cuando se compruebe que funcionan rutas admin/asociacion y admin/juego
  // Prioridad 5: Rutas /admin/{scopeType}/* (contextuales con número)
  // Ejemplo: /admin/2/socios, /admin/3/configuracion
  // Verifican que el scope actual coincida con el scopeType de la URL
  const adminScopeMatch = url.match(/^\/admin\/(\d+)/);
  if (adminScopeMatch) {
    const urlScopeType = parseInt(adminScopeMatch[1], 10);
    const currentScopeType = contextStore.scopeType();
    const currentScopeId = contextStore.scopeId();

    console.log(`🎯 [resolveScopeGuard] Ruta /admin/${urlScopeType} → Verificando scope actual ${currentScopeType}:${currentScopeId}`);

    // Verificar que el scope actual coincide con la URL y tiene scopeId definido
    if (currentScopeType === urlScopeType && currentScopeId !== null && currentScopeId !== undefined) {
      console.log(`✅ [resolveScopeGuard] Scope coincide → Manteniendo ${currentScopeType}:${currentScopeId}`);
      return permissionsStore.waitForLoad().pipe(map(() => true));
    } else {
      console.warn(`⚠️ [resolveScopeGuard] Scope no coincide o sin scopeId → Redirect a /`);
      router.navigateByUrl('/');
      return of(false);
    }
  }
@@@ ********/

  // Prioridad 5: Rutas /admin/{scopeName}/* (contextuales con nombre semántico)
  // Ejemplo: /admin/asociacion/members, /admin/juego/tournaments
  // Verifican que el scope actual coincida con el nombre semántico de la URL
  const adminSemanticMatch = url.match(/^\/admin\/(asociacion|juego)\//);
  if (adminSemanticMatch) {
    const scopeName = adminSemanticMatch[1];
    const expectedScope = scopeName === 'asociacion' ? WebScope.ASSOCIATION : WebScope.GAME;
    const currentScopeType = contextStore.scopeType();
    const currentScopeId = contextStore.scopeId();

    console.log(`🎯 [resolveScopeGuard] Ruta /admin/${scopeName} → Verificando scope actual ${currentScopeType}:${currentScopeId} (esperado: ${expectedScope})`);

    // Verificar que el scope actual coincide con el esperado y tiene scopeId definido
    if (currentScopeType === expectedScope && currentScopeId !== null && currentScopeId !== undefined) {
      console.log(`✅ [resolveScopeGuard] Scope coincide → Manteniendo ${currentScopeType}:${currentScopeId}`);
      return permissionsStore.waitForLoad().pipe(map(() => true));
    } else {
      console.warn(`⚠️ [resolveScopeGuard] Scope no coincide o sin scopeId → Redirect a /`);
      router.navigateByUrl('/');
      return of(false);
    }
  }

  // Prioridad 6: /admin raíz (preservar scope actual si existe)
  // Usar startsWith para manejar query params y hash
  const isAdminRoot = url === '/admin' || url === '/admin/' || url.startsWith('/admin?') || url.startsWith('/admin#');

  if (isAdminRoot) {
    const currentScopeType = contextStore.scopeType();
    const currentScopeId = contextStore.scopeId();

    console.log(`🎯 [resolveScopeGuard] /admin raíz detectado (url: ${url})`);
    console.log(`🎯 [resolveScopeGuard] Scope actual leído: ${currentScopeType}:${currentScopeId}`);

    if (currentScopeType !== null && currentScopeType !== undefined) {
      console.log(`✅ [resolveScopeGuard] /admin raíz → Preservando scope actual ${currentScopeType}:${currentScopeId}`);
      return permissionsStore.waitForLoad().pipe(map(() => true));
    }

    // Si no hay scope actual, establecer GLOBAL y devolver
    console.log(`🎯 [resolveScopeGuard] /admin raíz sin scope previo → Estableciendo GLOBAL`);
    contextStore.setGlobal('router');
    return permissionsStore.waitForLoad().pipe(map(() => true));
  }

  // Fallback: Scope GLOBAL (para /perfil, /login, /admin sin contexto previo, etc)
  console.log(`🎯 [resolveScopeGuard] Ruta sin scope específico → Scope GLOBAL`);
  contextStore.setGlobal('router');

  return permissionsStore.waitForLoad().pipe(map(() => true));
};
