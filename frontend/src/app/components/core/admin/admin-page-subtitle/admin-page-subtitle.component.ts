import { Component, ChangeDetectionStrategy, computed, input, inject } from '@angular/core';
import { ContextStore } from '../../../../core/context/context.store';
import { AssociationsResolveService } from '../../../../core/associations/associations-resolve.service';
import { GamesStore } from '../../../../core/games/games.store';
import { WebScope } from '../../../../core/web-scope.constants';

/**
 * Componente que muestra el subtítulo contextual en páginas de administración.
 *
 * Automáticamente muestra:
 * - "Administración de la web" para contexto GLOBAL
 * - Nombre de la asociación para contexto ASSOCIATION
 * - Nombre del juego para contexto GAME
 *
 * Se puede sobrescribir con customText si se necesita un texto específico.
 */
@Component({
  selector: 'app-admin-page-subtitle',
  template: `
    @if (displayText()) {
      <p class="ds-admin-page-subtitle">{{ displayText() }}</p>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminPageSubtitleComponent {
  private readonly contextStore = inject(ContextStore);
  private readonly associationsResolve = inject(AssociationsResolveService);
  private readonly gamesStore = inject(GamesStore);

  /**
   * Texto personalizado opcional que sobrescribe la detección automática de contexto.
   */
  customText = input<string>();

  /**
   * Texto a mostrar en el subtítulo.
   * Prioriza customText si está presente, caso contrario usa detección automática.
   */
  displayText = computed(() => {
    const custom = this.customText();
    if (custom !== undefined) {
      return custom;
    }

    const scopeType = this.contextStore.scopeType();
    const scopeId = this.contextStore.scopeId();

    if (scopeType === WebScope.GLOBAL) {
      return 'Administración de la web';
    }

    if (scopeType === WebScope.ASSOCIATION && scopeId) {
      const association = this.associationsResolve.getById(scopeId);
      return association?.name ?? '';
    }

    if (scopeType === WebScope.GAME && scopeId) {
      const game = this.gamesStore.getById(scopeId);
      return game?.name ?? '';
    }

    return '';
  });
}
