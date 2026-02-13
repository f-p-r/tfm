import { Injectable, inject } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute, Data } from '@angular/router';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { filter, map, catchError, switchMap } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';
import { PermissionsStore } from '../authz/permissions.store';
import { AdminAction, OwnableEntity } from './context.models';
import { WebScope } from '../web-scope.constants';
import { ContextStore } from './context.store';

/**
 * Servicio de contexto que calcula dinámicamente las acciones de administración
 * disponibles para el usuario según la ruta actual y sus permisos.
 *
 * Funcionalidad principal:
 * - Escucha eventos de navegación del router
 * - Lee el scope actual desde ContextStore (establecido por guards)
 * - Verifica permisos del usuario usando PermissionsStore
 * - Calcula acciones de administración disponibles (Editar Página, Administrar Contexto)
 * - Publica las acciones en adminActions$ para ser consumidas por componentes UI
 *
 * IMPORTANTE: Este servicio NO resuelve el scope desde la URL. Esa responsabilidad
 * la tienen los guards (resolveScopeGuard, gameBySlugGuard, associationBySlugGuard).
 * Este servicio solo CALCULA ACCIONES basándose en el scope ya establecido.
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
  private permissionsStore = inject(PermissionsStore);
  private authService = inject(AuthService);
  private contextStore = inject(ContextStore);

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
      map(() => this.getDeepestRoute(this.route)),
      switchMap(route => {
        const data = route.snapshot.data;
        const params = route.snapshot.params;
        const url = this.router.url;
        if (!this.authService.isAuthenticated()) {
           return of([]);
        }
        return this.calculateAdminActions(data, params, url);
      })
    ).subscribe(actions => {
      this.adminActionsSubject.next(actions);
    });
  }

  /**
   * Calcula las acciones de administración disponibles para el usuario en el contexto actual.
   *
   * IMPORTANTE: El scope ya está establecido por resolveScopeGuard o guards específicos
   * (gameBySlugGuard, associationBySlugGuard). Este método solo lee el scope desde
   * ContextStore y calcula las acciones autorizadas según permisos.
   *
   * @param data - Datos de la ruta activa (puede contener 'entity')
   * @param params - Parámetros de la ruta (no usados, el scope ya está en ContextStore)
   * @param url - URL completa (no usada, el scope ya está en ContextStore)
   * @returns Observable con array de AdminAction autorizadas
   */
  private calculateAdminActions(data: Data, params: any, url: string): Observable<AdminAction[]> {
    // El scope ya está establecido por los guards, solo lo leemos
    const scopeType = this.contextStore.scopeType();
    const scopeId = this.contextStore.scopeId() ?? 0;

    console.log(`🔍 [ContextService] 3. Scope actual: ${scopeType}:${scopeId} (establecido por guards)`);

    // ESPERAR a que los permisos estén cargados antes de verificar
    return this.permissionsStore.waitForLoad().pipe(
      map(() => {
        const actions: AdminAction[] = [];

        // A) Editar Entidad
        if (data['entity']) {
          console.log('🔍 [ContextService] -> Detectada entidad, verificando permiso edición...');
          const editAction = this.checkEntityEdit(data['entity']);
          if (editAction) {
            actions.push(editAction);
          }
        }

        // B) Administrar Contexto
        console.log(`🔍 [ContextService] -> Verificando admin de contexto (Type: ${scopeType}, ID: ${scopeId})...`);
        const adminAction = this.checkContextAdmin(scopeType, scopeId);
        if (adminAction) {
          actions.push(adminAction);
        }

        console.log('🔍 [ContextService] 4. Acciones finales calculadas:', actions);
        return actions;
      }),
      catchError(err => {
        console.error('❌ [ContextService] Error fatal:', err);
        return of([]);
      })
    );
  }

  /**
   * Verifica si el usuario tiene permiso 'pages.edit' para editar una entidad (página).
   * Si tiene permiso, devuelve una AdminAction con la ruta de edición.
   * Verificación síncrona desde PermissionsStore (sin HTTP).
   *
   * @param entity - Entidad con ownerType y ownerId para verificar permisos
   * @returns AdminAction si tiene permiso, null si no
   */
  private checkEntityEdit(entity: OwnableEntity): AdminAction | null {
    const hasPermission = this.permissionsStore.hasPermission(this.PERM_PAGE_EDIT);
    console.log(`🔍 [ContextService] 4. Permiso Edición (${this.PERM_PAGE_EDIT}):`, hasPermission ? 'APROBADO' : 'DENEGADO');

    if (hasPermission) {
      return {
        label: 'Editar Página',
        route: ['/admin', 'pages', entity.ownerType, entity.ownerId, 'edit', entity.id],
        isVisible: true
      };
    }
    return null;
  }

  /**
   * Verifica si el usuario tiene permiso 'admin' en el contexto actual.
   * Si tiene permiso, devuelve una AdminAction para acceder al panel de administración.
   * Verificación síncrona desde PermissionsStore (sin HTTP).
   *
   * Etiqueta según scope:
   * - Global: "Administración"
   * - Asociación: "Administrar Asociación"
   * - Juego: "Administrar Juego"
   *
   * @param scopeType - Tipo de scope (WebScope.GLOBAL, ASSOCIATION, GAME)
   * @param scopeId - ID del scope (0 para global)
   * @returns AdminAction si tiene permiso, null si no
   */
  private checkContextAdmin(scopeType: number, scopeId: number): AdminAction | null {
    const hasPermission = this.permissionsStore.hasPermission(this.PERM_ADMIN);
    console.log(`🔍 [ContextService] 5. Permiso Admin (${this.PERM_ADMIN}):`, hasPermission ? 'APROBADO' : 'DENEGADO');

    if (hasPermission) {
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
