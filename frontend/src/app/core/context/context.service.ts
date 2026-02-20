import { Injectable, inject, effect } from '@angular/core';
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
    // Recalcular admin actions en cada navegación
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

    // Effect: Recalcular admin actions cuando cambia el usuario, permisos o scope
    effect(() => {
      // Detectar cambios en usuario autenticado
      const user = this.authService.currentUser();
      // Detectar cambios en permisos (usando allPermissions como trigger)
      const permissions = this.permissionsStore.allPermissions();
      // Detectar si los permisos están cargando
      const isLoading = this.permissionsStore.isLoading();
      // Detectar cambios en scope
      const scopeType = this.contextStore.scopeType();
      const scopeId = this.contextStore.scopeId();

      console.log('🔄 [ContextService] Cambio detectado → Recalculando admin actions');
      console.log('🔄 [ContextService] Usuario:', user?.username, 'Permisos:', permissions.length, 'Loading:', isLoading, 'Scope:', `${scopeType}:${scopeId}`);

      // Si no hay usuario, limpiar acciones
      if (!user) {
        this.adminActionsSubject.next([]);
        return;
      }

      // Si los permisos están cargando, esperar (no calcular todavía)
      if (isLoading) {
        console.log('⏳ [ContextService] Permisos cargando... Esperando...');
        return;
      }

      // Recalcular acciones con la ruta actual (sin esperar, ya tenemos los permisos)
      const route = this.getDeepestRoute(this.route);
      const data = route.snapshot.data;
      const params = route.snapshot.params;
      const url = this.router.url;

      // IMPORTANTE: No usar waitForLoad() aquí, ya tenemos los permisos en el signal 'permissions'
      // El effect se dispara cuando 'permissions' cambia, así que siempre están actualizados
      const actions: AdminAction[] = [];

      // A) Editar Entidad
      if (data['entity']) {
        const editAction = this.checkEntityEdit(data['entity']);
        if (editAction) {
          actions.push(editAction);
        }
      }

      // B) Administrar Contexto
      const adminAction = this.checkContextAdmin(scopeType, scopeId ?? 0);
      if (adminAction) {
        actions.push(adminAction);
      }

      console.log('🔄 [ContextService] Acciones calculadas en effect:', actions);
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

    console.log(`[>] [ContextService] 3. Scope actual: ${scopeType}:${scopeId} (establecido por guards)`);

    // ESPERAR a que los permisos estén cargados antes de verificar
    return this.permissionsStore.waitForLoad().pipe(
      map(() => {
        const actions: AdminAction[] = [];

        // A) Editar Entidad
        if (data['entity']) {
          console.log('[>] [ContextService] -> Detectada entidad, verificando permiso edición...');
          const editAction = this.checkEntityEdit(data['entity']);
          if (editAction) {
            actions.push(editAction);
          }
        }

        // B) Administrar Contexto
        console.log(`[>] [ContextService] -> Verificando admin de contexto (Type: ${scopeType}, ID: ${scopeId})...`);
        const adminAction = this.checkContextAdmin(scopeType, scopeId);
        if (adminAction) {
          actions.push(adminAction);
        }

        console.log('[>] [ContextService] 4. Acciones finales calculadas:', actions);
        return actions;
      }),
      catchError(err => {
        console.error('[ERROR] [ContextService] Error fatal:', err);
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
    console.log(`[>] [ContextService] 4. Permiso Edición (${this.PERM_PAGE_EDIT}):`, hasPermission ? 'APROBADO' : 'DENEGADO');

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
   * Verifica si el usuario tiene ALGÚN permiso en el contexto actual.
   * Si tiene al menos un permiso, devuelve una AdminAction para acceder al panel de administración.
   * Verificación síncrona desde PermissionsStore (sin HTTP).
   *
   * Lógica:
   * - Si tiene permiso 'admin': muestra botón "Administración" / "Administrar X"
   * - Si tiene cualquier otro permiso (ej: pages.edit): muestra botón "Administrar X"
   * - Si no tiene ningún permiso: no muestra botón
   *
   * Etiqueta según scope:
   * - Global: "Administración"
   * - Asociación: "Administrar Asociación"
   * - Juego: "Administrar Juego"
   *
   * @param scopeType - Tipo de scope (WebScope.GLOBAL, ASSOCIATION, GAME)
   * @param scopeId - ID del scope (0 para global)
   * @returns AdminAction si tiene algún permiso, null si no
   */
  private checkContextAdmin(scopeType: number, scopeId: number): AdminAction | null {
    // Verificar si tiene al menos un permiso en este scope
    const allPermissions = this.permissionsStore.allPermissions();
    const hasAnyPermission = allPermissions.length > 0;

    console.log(`[>] [ContextService] 5. Permisos en scope actual:`, allPermissions);
    console.log(`[>] [ContextService] 5. ¿Tiene algún permiso?:`, hasAnyPermission ? 'SÍ' : 'NO');

    if (hasAnyPermission) {
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
