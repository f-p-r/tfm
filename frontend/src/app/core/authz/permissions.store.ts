/**
 * Store centralizado de permisos del usuario en el scope actual.
 *
 * Funcionalidad:
 * - Carga TODOS los permisos del usuario una vez por scope (UNA sola llamada HTTP)
 * - Almacena permisos en señales (signals) reactivas
 * - Combina permisos wildcard (allPermissions) con permisos específicos del scope
 * - Ofrece verificación síncrona e instantánea de permisos
 * - Se actualiza automáticamente cuando cambia el scope en ContextStore
 *
 * Beneficios:
 * - Reduce múltiples llamadas HTTP a una sola por scope
 * - Aprovecha al 100% la caché de AuthzService
 * - Verificaciones síncronas (sin Observables)
 * - Código más simple y performante
 *
 * @example
 * ```typescript
 * constructor(private permissionsStore = inject(PermissionsStore)) {}
 *
 * ngOnInit() {
 *   // Cargar permisos del scope actual
 *   this.permissionsStore.loadForCurrentScope();
 *
 *   // Verificar permiso (síncrono)
 *   const canEdit = this.permissionsStore.hasPermission('pages.edit');
 *
 *   // Obtener todos los permisos (signal reactivo)
 *   const allPerms = this.permissionsStore.allPermissions();
 * }
 * ```
 */

import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { Observable, of, Subject } from 'rxjs';
import { first } from 'rxjs/operators';
import { AuthzService } from './authz.service';
import { ContextStore } from '../context/context.store';
import { AuthService } from '../auth/auth.service';
import { isBreakdownResponse } from './authz.models';

@Injectable({ providedIn: 'root' })
export class PermissionsStore {
  private readonly authz = inject(AuthzService);
  private readonly contextStore = inject(ContextStore);
  private readonly authService = inject(AuthService);

  /** Subject que emite cuando los permisos terminan de cargarse */
  private readonly loadComplete$ = new Subject<void>();

  // -------------------------------------------------------------------------
  // ESTADO
  // -------------------------------------------------------------------------

  /** Permisos efectivos del usuario en el scope actual (wildcard + específicos combinados) */
  private readonly permissions = signal<string[]>([]);

  /** Indica si los permisos están cargándose actualmente */
  private readonly loading = signal<boolean>(false);

  /** Última clave de scope cargada (para evitar recargas innecesarias) */
  private lastLoadedScopeKey = signal<string | null>(null);

  // -------------------------------------------------------------------------
  // SEÑALES PÚBLICAS
  // -------------------------------------------------------------------------

  /** Todos los permisos del usuario en el scope actual (solo lectura) */
  readonly allPermissions = computed(() => this.permissions());

  /** Indica si hay permisos cargados */
  readonly hasPermissions = computed(() => this.permissions().length > 0);

  /** Indica si los permisos están cargándose */
  readonly isLoading = computed(() => this.loading());

  // -------------------------------------------------------------------------
  // CONSTRUCTOR
  // -------------------------------------------------------------------------

  constructor() {
    // Effect 1: Auto-limpieza y recarga cuando cambia el estado de autenticación
    effect(() => {
      const user = this.authService.currentUser();

      if (user === null) {
        // Usuario deslogueado → Limpiar permisos inmediatamente
        console.log('🧹 [PermissionsStore] Usuario deslogueado → Limpiando permisos');
        this.permissions.set([]);
        this.lastLoadedScopeKey.set(null);
        this.loading.set(false);
      } else {
        // Usuario autenticado → Recargar permisos para el scope actual
        console.log('[OK] [PermissionsStore] Usuario autenticado:', user.username, '→ Recargando permisos');
        this.loadForCurrentScope();
      }
    });

    // Effect 2: Auto-recarga cuando cambia el scope (solo si hay usuario autenticado)
    effect(() => {
      const scopeKey = this.contextStore.scopeKey();
      const lastKey = this.lastLoadedScopeKey();
      const user = this.authService.currentUser();

      // Solo recargar si hay usuario Y el scope cambió
      if (user && scopeKey !== lastKey) {
        console.log(`[>] [PermissionsStore] Scope cambió de "${lastKey}" a "${scopeKey}" → Recargando permisos`);
        this.loadForCurrentScope();
      }
    });
  }

  // -------------------------------------------------------------------------
  // MÉTODOS PÚBLICOS
  // -------------------------------------------------------------------------

  /**
   * Carga todos los permisos del usuario para el scope actual en ContextStore.
   * Hace UNA sola llamada HTTP con breakdown=true y permissions=[].
   * Combina permisos wildcard (aplican a todos los scopes) con permisos específicos del scope.
   */
  loadForCurrentScope(): void {
    const scopeType = this.contextStore.scopeType();
    const scopeId = this.contextStore.scopeId() ?? 0;
    const scopeKey = this.contextStore.scopeKey();

    this.loading.set(true);
    this.lastLoadedScopeKey.set(scopeKey);

    console.log(`[>] [PermissionsStore] Cargando permisos para scope ${scopeType}:${scopeId}`);

    this.authz.query({
      scopeType: scopeType,
      scopeIds: scopeId === 0 ? [] : [scopeId],
      permissions: [],     // Array vacío = TODOS los permisos del usuario
      breakdown: true      // Respuesta detallada con wildcard + específicos
    }).subscribe({
      next: (res) => {
        if (isBreakdownResponse(res)) {
          // 1. Permisos wildcard (aplican a CUALQUIER scope de este tipo)
          const wildcardPerms = res.allPermissions || [];

          // 2. Permisos específicos de ESTE scope concreto
          const scopeResult = res.results.find(r => r.scopeId === scopeId);
          const scopePerms = scopeResult?.permissions || [];

          // 3. COMBINAR: wildcard + específicos = permisos efectivos totales
          // Esto replica el comportamiento de breakdown=false (donde all=true significa "tiene permiso")
          const effectivePermissions = [...new Set([...wildcardPerms, ...scopePerms])];

          this.permissions.set(effectivePermissions);
          this.loading.set(false);
          this.loadComplete$.next(); // Notificar que terminó la carga

          console.log(`[OK] [PermissionsStore] ${effectivePermissions.length} permisos cargados:`, effectivePermissions);
        }
      },
      error: (err) => {
        console.error('[ERROR] [PermissionsStore] Error al cargar permisos:', err);
        this.permissions.set([]);
        this.loading.set(false);
        this.loadComplete$.next(); // Notificar que terminó (aunque con error)

        // Si es 401, limpiar caché (sesión perdida)
        if (err.status === 401) {
          this.authz.clearCache();
        }
      }
    });
  }

  /**
   * Verifica si el usuario tiene un permiso específico en el scope actual.
   * Verificación síncrona e instantánea (no requiere HTTP, lee desde memoria).
   *
   * Casos especiales:
   * - Si el usuario tiene permiso wildcard '*', devuelve true para cualquier permiso
   * - Si el usuario tiene el permiso específico, devuelve true
   * - Caso contrario, devuelve false
   *
   * @param permission Nombre del permiso a verificar (ej: 'admin', 'pages.edit')
   * @returns true si el usuario tiene el permiso, false si no
   */
  hasPermission(permission: string): boolean {
    const perms = this.permissions();

    // Wildcard: superadmin global
    if (perms.includes('*')) {
      return true;
    }

    // Permiso específico
    return perms.includes(permission);
  }

  /**
   * Verifica si el usuario tiene AL MENOS UNO de los permisos especificados.
   *
   * @param permissions Array de permisos a verificar
   * @returns true si tiene al menos uno, false si no tiene ninguno
   */
  hasAnyPermission(permissions: string[]): boolean {
    return permissions.some(perm => this.hasPermission(perm));
  }

  /**
   * Devuelve un Observable que se completa cuando los permisos terminan de cargarse.
   * Si ya están cargados (loading=false), se completa inmediatamente.
   * Útil para esperar a que los permisos estén listos antes de hacer verificaciones.
   *
   * @returns Observable<void> que se completa cuando la carga termina
   */
  waitForLoad(): Observable<void> {
    // Si no está cargando, completar inmediatamente
    if (!this.loading()) {
      return of(void 0);
    }

    // Esperar a la próxima emisión de loadComplete$
    return this.loadComplete$.pipe(first());
  }

  /**
   * Verifica si el usuario tiene TODOS los permisos especificados.
   *
   * @param permissions Array de permisos a verificar
   * @returns true si tiene todos, false si falta alguno
   */
  hasAllPermissions(permissions: string[]): boolean {
    return permissions.every(perm => this.hasPermission(perm));
  }

  /**
   * Fuerza recarga de permisos desde el backend (bypaseando caché si es necesario).
   * Útil en casos donde se sabe que los permisos cambiaron (ej: admin acaba de actualizar roles).
   */
  refresh(): void {
    console.log('🔄 [PermissionsStore] Refresh forzado de permisos');
    this.authz.clearCache();
    this.loadForCurrentScope();
  }

  /**
   * Limpia todos los permisos almacenados.
   * Útil al hacer logout o cambiar de usuario.
   */
  clear(): void {
    console.log('🧹 [PermissionsStore] Limpiando permisos manualmente');
    console.log('🧹 [PermissionsStore] Permisos antes de limpiar:', this.permissions());
    this.permissions.set([]);
    this.lastLoadedScopeKey.set(null);
    this.loading.set(false);
    console.log('🧹 [PermissionsStore] Permisos después de limpiar:', this.permissions());
  }
}
