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
  // NOTA: Asegúrate que coinciden con tu BD. Si dudas, prueba con 'web.admin'
  private readonly PERM_ADMIN = 'admin';
  private readonly PERM_PAGE_EDIT = 'pages.edit';

  // -------------------------------------------------------------------------
  // ESTADO
  // -------------------------------------------------------------------------
  private adminActionsSubject = new BehaviorSubject<AdminAction[]>([]);
  public adminActions$ = this.adminActionsSubject.asObservable();

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

  private getDeepestRoute(route: ActivatedRoute): ActivatedRoute {
    while (route.firstChild) {
      route = route.firstChild;
    }
    return route;
  }
}
