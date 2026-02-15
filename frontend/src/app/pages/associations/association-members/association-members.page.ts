import { ChangeDetectionStrategy, Component, inject, computed } from '@angular/core';
import { ContextStore } from '../../../core/context/context.store';
import { AssociationsResolveService } from '../../../core/associations/associations-resolve.service';

/**
 * Página de socios de una asociación.
 *
 * Funcionalidades:
 * - Solicitar membresía (si no es miembro)
 * - Ver estado de solicitud (si tiene solicitud pendiente)
 * - Área privada de socios (si es miembro activo)
 *
 * TODO: Implementar lógica completa de membresía
 */
@Component({
  selector: 'app-association-members-page',
  imports: [],
  template: `
    <div class="ds-container py-8">
      <header class="border-b border-neutral-medium pb-4">
        <h1 class="h1">Socios</h1>
        @if (associationName()) {
          <p class="text-sm text-neutral-dark mt-1">{{ associationName() }}</p>
        }
      </header>

      <section class="mt-6">
        <div class="bg-neutral-light border border-neutral-medium rounded-lg p-8 text-center">
          <p class="text-neutral-dark text-lg mb-4">
            Esta sección está en desarrollo.
          </p>
          <p class="text-neutral-medium text-sm">
            Aquí podrás solicitar membresía, consultar el estado de tu solicitud y acceder al área de socios.
          </p>
        </div>
      </section>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssociationMembersPage {
  private readonly contextStore = inject(ContextStore);
  private readonly associationsResolve = inject(AssociationsResolveService);

  readonly associationName = computed(() => {
    const scopeId = this.contextStore.scopeId();
    if (scopeId) {
      const association = this.associationsResolve.getById(scopeId);
      return association?.name;
    }
    return '';
  });
}
