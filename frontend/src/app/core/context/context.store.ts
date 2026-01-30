/**
 * Store de contexto de navegación.
 *
 * Mantiene el alcance (scope) actual de la aplicación para determinar
 * el contexto de navegación y permisos del usuario.
 *
 * Ejemplos de uso:
 * - Navegación global: scopeType=GLOBAL, scopeId=null
 * - Dentro de una asociación: scopeType=ASSOCIATION, scopeId=123
 * - Dentro de un juego: scopeType=GAME, scopeId=456
 *
 * El store es SSR-friendly (no usa localStorage).
 */

import { Injectable, signal, computed } from '@angular/core';
import { WebScope } from '../web-scope.constants';

/**
 * Fuente que actualizó el contexto.
 * - router: Cambio detectado por navegación/ruta
 * - resource: Cargado desde un recurso/API
 * - manual: Establecido programáticamente
 * - unknown: Tipo conocido pero ID pendiente
 */
export type ContextSource = 'router' | 'resource' | 'manual' | 'unknown';

@Injectable({ providedIn: 'root' })
export class ContextStore {
  /** Tipo de alcance actual (GLOBAL, ASSOCIATION, GAME) */
  readonly scopeType = signal<WebScope>(WebScope.GLOBAL);

  /** ID del alcance específico (null si es GLOBAL o no aplica) */
  readonly scopeId = signal<number | null>(null);

  /** Fuente que estableció el contexto actual */
  readonly source = signal<ContextSource>('manual');

  /** Timestamp de la última actualización (útil para depuración) */
  readonly updatedAt = signal<number>(Date.now());

  /** Indica si el contexto actual es global */
  readonly isGlobal = computed(() => this.scopeType() === WebScope.GLOBAL);

  /**
   * Indica si hay un scope específico establecido.
   * true si scopeType no es GLOBAL y hay un scopeId válido.
   */
  readonly hasScope = computed(() => this.scopeType() !== WebScope.GLOBAL && this.scopeId() !== null);

  /**
   * Clave única del scope actual en formato "tipo:id".
   * Útil para cache keys o identificadores únicos.
   * Ejemplos: "1:all" (GLOBAL), "2:123" (ASSOCIATION 123), "3:456" (GAME 456)
   */
  readonly scopeKey = computed(() => `${this.scopeType()}:${this.scopeId() ?? 'all'}`);

  /**
   * Establece el contexto como global (sin alcance específico).
   *
   * @param source Fuente del cambio. Por defecto 'manual'.
   */
  setGlobal(source: ContextSource = 'manual'): void {
    this.scopeType.set(WebScope.GLOBAL);
    this.scopeId.set(null);
    this.source.set(source);
    this.updatedAt.set(Date.now());
  }

  /**
   * Establece un contexto de alcance específico.
   *
   * Reglas:
   * - Si scopeType es GLOBAL, fuerza scopeId a null independientemente del valor pasado.
   * - Si scopeType no es GLOBAL pero scopeId es null, guarda el estado pero marca source como 'unknown'
   *   (útil para casos donde se conoce el tipo pero aún no el ID específico).
   *
   * @param scopeType Tipo de alcance (GLOBAL, ASSOCIATION, GAME).
   * @param scopeId ID del alcance específico (null si no aplica).
   * @param source Fuente del cambio. Por defecto 'manual', se fuerza a 'unknown' si scopeId es null en scope no-global.
   */
  setScope(scopeType: WebScope, scopeId: number | null, source: ContextSource = 'manual'): void {
    // Si es GLOBAL, forzar scopeId a null
    if (scopeType === WebScope.GLOBAL) {
      this.scopeType.set(WebScope.GLOBAL);
      this.scopeId.set(null);
      this.source.set(source);
      this.updatedAt.set(Date.now());
      return;
    }

    // Si no es GLOBAL pero scopeId es null, mantener pero marcar como 'unknown'
    if (scopeId === null) {
      this.scopeType.set(scopeType);
      this.scopeId.set(null);
      this.source.set('unknown');
      this.updatedAt.set(Date.now());
      return;
    }

    // Caso normal: scope con tipo e ID válidos
    this.scopeType.set(scopeType);
    this.scopeId.set(scopeId);
    this.source.set(source);
    this.updatedAt.set(Date.now());
  }

  /**
   * Limpia el contexto, estableciéndolo como global.
   * Equivalente a setGlobal('manual').
   */
  clear(): void {
    this.setGlobal('manual');
  }
}
