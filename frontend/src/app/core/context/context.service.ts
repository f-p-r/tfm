import { Injectable, inject } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute, Data } from '@angular/router';
import { BehaviorSubject, Observable, of, forkJoin } from 'rxjs';
import { filter, map, switchMap, catchError, tap } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';
import { AuthzService } from '../authz/authz.service';
import { isSummaryResponse } from '../authz/authz.models';
import { AdminAction, OwnableEntity } from './context.models';
import { WebScope } from '../web-scope.constants';
import { GamesStore } from '../games/games.store';
import { AssociationsResolveService } from '../associations/associations-resolve.service';

/**
 * Servicio de contexto que determina dinámicamente las acciones de administración
 * disponibles para el usuario según la ruta actual y sus permisos.
 *
 * Funcionalidad principal:
 * - Escucha eventos de navegación del router
 * - Resuelve el contexto actual (scope: Global, Asociación o Juego) desde la URL
 * - Verifica permisos del usuario usando AuthzService (con caché de 120 seg)
 * - Calcula acciones de administración disponibles (Editar Página, Administrar Contexto)
 * - Publica las acciones en adminActions$ para ser consumidas por componentes UI
 *
 * Las acciones se recalculan automáticamente en cada navegación y se filtran
 * según los permisos del usuario autenticado.
 *
 * @example
 * ```typescript
 * constructor(private context = inject(ContextService)) {}
 *
 * ngOnInit() {
 *   this.context.adminActions$.subscribe(actions => {
 *     console.log('Acciones disponibles:', actions);
 *   });
 * }
 * ```
 */
@Injectable({ providedIn: 'root' })
export class ContextService {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private authz = inject(AuthzService);
  private authService = inject(AuthService);
  private gamesStore = inject(GamesStore);
  private associationsResolve = inject(AssociationsResolveService);

  // -------------------------------------------------------------------------
  // CONSTANTES DE PERMISOS
  // -------------------------------------------------------------------------
   private readonly PERM_ADMIN = 'admin';
  private readonly PERM_PAGE_EDIT = 'pages.edit';

  // -------------------------------------------------------------------------
  // ESTADO
  // -------------------------------------------------------------------------
  private adminActionsSubject = new BehaviorSubject<AdminAction[]>([]);
  public adminActions$ = this.adminActionsSubject.asObservable();

  /**
   * Inicializa el servicio suscribiéndose a eventos de navegación del router.
   * En cada navegación:
   * - Obtiene la ruta más profunda
   * - Extrae datos y parámetros de la ruta
   * - Calcula acciones de administración según contexto y permisos
   * - Publica las acciones en adminActions$
   */
  constructor() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      tap(() => console.log('🔍 [ContextService] 1. Navegación detectada')),
      map(() => this.getDeepestRoute(this.route)),
      switchMap(route => {
        const data = route.snapshot.data;
        const params = route.snapshot.params;
        const url = this.router.url;
        console.log('🔍 [ContextService] 2. Analizando URL:', url, 'Datos:', data);
        if (!this.authService.isAuthenticated()) {
           return of([]);
        }
        return this.calculateAdminActions(data, params, url);
      })
    ).subscribe(actions => {
      console.log('🔍 [ContextService] 6. Acciones finales calculadas:', actions);
      this.adminActionsSubject.next(actions);
    });
  }

  /**
   * Calcula las acciones de administración disponibles para el usuario en el contexto actual.
   * Verifica permisos usando AuthzService (con caché) y filtra las acciones permitidas.
   *
   * @param data - Datos de la ruta activa (puede contener 'entity')
   * @param params - Parámetros de la ruta (slugs, IDs)
   * @param url - URL completa de la navegación actual
   * @returns Observable con array de AdminAction autorizadas
   */
  private calculateAdminActions(data: Data, params: any, url: string): Observable<AdminAction[]> {
    return this.resolveContext(data, params, url).pipe(
      tap(ctx => console.log('🔍 [ContextService] 3. Contexto resuelto:', ctx)),
      switchMap(ctx => {
        const potentialActions$: Observable<AdminAction | null>[] = [];

        // A) Editar Entidad
        if (data['entity']) {
          console.log('🔍 [ContextService] -> Detectada entidad, verificando permiso edición...');
          potentialActions$.push(this.checkEntityEdit(data['entity']));
        }

        // B) Administrar Contexto
        console.log(`🔍 [ContextService] -> Verificando admin de contexto (Type: ${ctx.type}, ID: ${ctx.id})...`);
        potentialActions$.push(this.checkContextAdmin(ctx.type, ctx.id));

        return forkJoin(potentialActions$);
      }),
      map(results => results.filter((action): action is AdminAction => action !== null)),
      catchError(err => {
        console.error('❌ [ContextService] Error fatal:', err);
        return of([]);
      })
    );
  }

  /**
   * Resuelve el contexto (scope) actual desde la URL y datos de la ruta.
   * Determina si estamos en contexto Global, Asociación o Juego.
   *
   * Jerarquía de resolución:
   * 1. Si hay entity en data, usa entity.ownerType y entity.ownerId
   * 2. Si URL empieza con /asociaciones, resuelve el slug de asociación
   * 3. Si URL empieza con /juegos, busca el juego por slug
   * 4. Fallback: contexto Global (type: WebScope.GLOBAL, id: 0)
   *
   * @param data - Datos de la ruta (puede contener 'entity')
   * @param params - Parámetros de la ruta (slug, assocSlug, gameSlug)
   * @param url - URL completa para detectar sección
   * @returns Observable con {type: scopeType, id: scopeId}
   */
  private resolveContext(data: Data, params: any, url: string): Observable<{type: number, id: number}> {
    if (data['entity']) {
      const entity = data['entity'] as OwnableEntity;
      return of({ type: entity.ownerType, id: entity.ownerId });
    }

    if (url.startsWith('/asociaciones')) {
      const slug = params['slug'] || params['assocSlug'];
      if (slug) {
        return this.associationsResolve.resolveBySlug(slug).pipe(
          map(assoc => ({ type: WebScope.ASSOCIATION, id: assoc.id })),
          catchError(err => {
            console.warn('⚠️ [ContextService] No se encontró asociación:', slug);
            return of({ type: WebScope.GLOBAL, id: 0 });
          })
        );
      }
    }

    if (url.startsWith('/juegos')) {
      const slug = params['slug'] || params['gameSlug'];
      if (slug) {
        const games = this.gamesStore.sortedGames();
        const game = games.find(g => g.slug === slug);
        if (game) {
          return of({ type: WebScope.GAME, id: game.id });
        }
      }
    }

    return of({ type: WebScope.GLOBAL, id: 0 });
  }

  /**
   * Verifica si el usuario tiene permiso 'pages.edit' para editar una entidad (página).
   * Si tiene permiso, devuelve una AdminAction con la ruta de edición.
   *
   * Nota: Si entity.ownerId es 0 (global), pasa scopeIds=[] al backend.
   *
   * @param entity - Entidad con ownerType y ownerId para verificar permisos
   * @returns Observable con AdminAction si tiene permiso, null si no
   */
  private checkEntityEdit(entity: OwnableEntity): Observable<AdminAction | null> {
    var ids: number[] = [];
    // si entity.ownerId es 0, hemos de pasar en scopeIDs un array vacío para que el backend entienda que es global (sin scope específico)
    if (entity.ownerId === 0) {
      ids = [];
    }  else {
      ids = [entity.ownerId];
    }
    return this.authz.query({
      scopeType: entity.ownerType,
      scopeIds: ids,
      permissions: [this.PERM_PAGE_EDIT],
      breakdown: false
    }).pipe(
      tap(res => console.log(`🔍 [ContextService] 4. Permiso Edición (${this.PERM_PAGE_EDIT}):`, isSummaryResponse(res) && res.all ? 'APROBADO' : 'DENEGADO')),
      map(res => {
        if (isSummaryResponse(res) && res.all) {
          return {
            label: 'Editar Página',
            route: ['/admin', 'pages', entity.ownerType, entity.ownerId, 'edit', entity.id],
            isVisible: true
          };
        }
        return null;
      }),
      catchError(() => of(null))
    );
  }

  /**
   * Verifica si el usuario tiene permiso 'admin' en el contexto actual.
   * Si tiene permiso, devuelve una AdminAction para acceder al panel de administración.
   *
   * Etiqueta según scope:
   * - Global: "Administración"
   * - Asociación: "Administrar Asociación"
   * - Juego: "Administrar Juego"
   *
   * Nota: Si scopeId es 0 (global), pasa scopeIds=[] al backend.
   *
   * @param scopeType - Tipo de scope (WebScope.GLOBAL, ASSOCIATION, GAME)
   * @param scopeId - ID del scope (0 para global)
   * @returns Observable con AdminAction si tiene permiso, null si no
   */
  private checkContextAdmin(scopeType: number, scopeId: number): Observable<AdminAction | null> {
    // Si el ID es 0 (Global), enviamos array vacío []
    // para que el backend no valide "scopeIds.0 must be at least 1"
    const ids = scopeId === 0 ? [] : [scopeId];

    return this.authz.query({
      scopeType: scopeType,
      scopeIds: ids,
      permissions: [this.PERM_ADMIN],
      breakdown: false
    }).pipe(
      tap(res => console.log(`🔍 [ContextService] 5. Permiso Admin (${this.PERM_ADMIN}):`, isSummaryResponse(res) && res.all ? 'APROBADO' : 'DENEGADO')),
      map(res => {
        if (isSummaryResponse(res) && res.all) {
          let label = 'Administración';
          let route = ['/admin'];

          if (scopeType === WebScope.ASSOCIATION) {
            label = 'Administrar Asociación';
          } else if (scopeType === WebScope.GAME) {
            label = 'Administrar Juego';
          }

          return {
            label,
            route,
            isVisible: true
          };
        }
        return null;
      }),
      catchError(() => of(null))
    );
  }

  /**
   * Obtiene la ruta hoja más profunda del árbol de rutas activadas.
   * Útil para acceder a los datos y parámetros de la ruta final renderizada.
   *
   * @param route - Ruta raíz desde donde empezar a descender
   * @returns Ruta hoja sin hijos (la más profunda del árbol)
   */
  private getDeepestRoute(route: ActivatedRoute): ActivatedRoute {
    while (route.firstChild) {
      route = route.firstChild;
    }
    return route;
  }
}
