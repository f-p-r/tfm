import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { ContextStore } from '../../core/context/context.store';
import { WebScope } from '../../core/web-scope.constants';

/**
 * Página de listado de asociaciones (placeholder).
 *
 * Scope: GLOBAL
 */
@Component({
  selector: 'app-associations-page',
  imports: [NavbarComponent],
  template: `
    <app-navbar />
    <main class="ds-main">
      <div class="ds-page">
        <div class="ds-container">
          <header class="border-b border-neutral-medium pb-4">
            <h1 class="h1">Asociaciones</h1>
            <p class="mt-2 text-neutral-dark">Listado global de asociaciones (placeholder)</p>
          </header>

          <section class="mt-6">
            <h2 class="text-lg font-semibold text-neutral-dark mb-3">ContextStore</h2>
            <div class="bg-neutral-light border border-neutral-medium rounded-lg p-4 text-sm text-neutral-dark space-y-2">
              <p><strong>scopeType:</strong> {{ contextStore.scopeType() }}
                @if (contextStore.scopeType() === WebScope.GLOBAL) { (GLOBAL) }
                @else if (contextStore.scopeType() === WebScope.ASSOCIATION) { (ASSOCIATION) }
                @else if (contextStore.scopeType() === WebScope.GAME) { (GAME) }
              </p>
              <p><strong>scopeId:</strong> {{ contextStore.scopeId() ?? 'null' }}</p>
              <p><strong>source:</strong> {{ contextStore.source() }}</p>
              <p><strong>isGlobal:</strong> {{ contextStore.isGlobal() }}</p>
              <p><strong>hasScope:</strong> {{ contextStore.hasScope() }}</p>
              <p><strong>scopeKey:</strong> {{ contextStore.scopeKey() }}</p>
              <p><strong>updatedAt:</strong> {{ contextStore.updatedAt() }}</p>
            </div>
          </section>
        </div>
      </div>
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssociationsPage {
  readonly contextStore = inject(ContextStore);
  
  // Exponer WebScope para el template
  readonly WebScope = WebScope;

  constructor() {
    // Establecer contexto global al entrar en la página
    this.contextStore.setGlobal('router');
  }
}
