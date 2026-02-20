import { ChangeDetectionStrategy, Component, inject, computed, signal, effect } from '@angular/core';
import { Router } from '@angular/router';
import { ContextStore } from '../../../core/context/context.store';
import { AssociationsResolveService } from '../../../core/associations/associations-resolve.service';
import { AuthService } from '../../../core/auth/auth.service';
import { UserAssociationApiService } from '../../../core/users/user-association-api.service';
import { UserAssociation } from '../../../core/users/user-association.models';
import { MemberStatusApiService } from '../../../core/associations/member-status-api.service';
import { MEMBER_STATUS_TYPES } from '../../../core/associations/member-status.constants';

/**
 * Página de socios de una asociación.
 *
 * Funcionalidades:
 * - Solicitar membresía (si no es miembro)
 * - Ver estado de solicitud (si tiene solicitud pendiente)
 * - Área privada de socios (si es miembro activo)
 */
@Component({
  selector: 'app-association-members-page',
  imports: [],
  template: `
    <div class="ds-container py-8">
      <div class="max-w-2xl">
        <header class="border-b border-neutral-medium pb-4">
          <h1 class="h1">{{ pageTitle() }}</h1>
          @if (associationName()) {
            <p class="text-sm text-neutral-dark mt-1">{{ associationName() }}</p>
          }
        </header>

        <section class="mt-6">
          <!-- Estado de carga -->
          @if (isLoading()) {
            <div class="bg-neutral-light border border-neutral-medium rounded-lg p-8 text-center">
              <p class="text-neutral-dark">Cargando...</p>
            </div>
          }

          <!-- Usuario NO relacionado con la asociación: Formulario de solicitud -->
          @else if (membershipStatus() === 'not-member') {
            <div class="bg-white border border-neutral-medium rounded-lg p-6 max-w-2xl mx-auto">
              <p class="text-neutral-dark mb-6">
                Para solicitar tu membresía en esta asociación, por favor confirma tu solicitud pulsando el botón a continuación.
                La asociación revisará tu solicitud y te contactará para los siguientes pasos.
              </p>

              @if (errorMessage()) {
                <div class="ds-alert ds-alert-error mb-4">
                  {{ errorMessage() }}
                </div>
              }

              @if (confirmationMessage()) {
                <div class="ds-alert ds-alert-success mb-4">
                  {{ confirmationMessage() }}
                </div>
                <div class="flex justify-center">
                  <button
                    type="button"
                    (click)="goToAssociation()"
                    class="ds-btn ds-btn-primary"
                  >
                    Volver
                  </button>
                </div>
              } @else {
                <div class="flex gap-3 justify-end">
                  <button
                    type="button"
                    (click)="goToAssociation()"
                    class="ds-btn ds-btn-secondary"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    (click)="requestMembership()"
                    [disabled]="isSubmitting()"
                    class="ds-btn ds-btn-primary"
                  >
                    {{ isSubmitting() ? 'Procesando...' : 'Confirmar solicitud' }}
                  </button>
                </div>
              }
            </div>
          }

          <!-- Usuario con solicitud PENDIENTE (status.type.id = 1) -->
          @else if (membershipStatus() === 'pending') {
            <div class="bg-neutral-light border border-neutral-medium rounded-lg p-8">
              @if (confirmationMessage()) {
                <div class="ds-alert ds-alert-success mb-6">
                  {{ confirmationMessage() }}
                </div>
              }
              <p class="text-neutral-dark text-lg mb-4">
                Ya has solicitado inscribirte en la asociación. Se te informará por correo electrónico los pasos siguientes.
              </p>
              <p class="text-neutral-dark text-sm mb-6">
                Para cualquier consulta, comunícate con la asociación en cualquiera de las opciones que podrás ver en el apartado "Contacto",
                clicando en el nombre de la asociación en la barra superior.
              </p>
              <div class="flex justify-center">
                <button
                  type="button"
                  (click)="goToAssociation()"
                  class="ds-btn ds-btn-primary"
                >
                  Volver
                </button>
              </div>
            </div>
          }

          <!-- Usuario ya es MIEMBRO (otros estados) -->
          @else if (membershipStatus() === 'member') {
            <div class="bg-neutral-light border border-neutral-medium rounded-lg p-8 text-center">
              <p class="text-neutral-dark text-lg mb-4">
                Esta sección está en desarrollo.
              </p>
              <p class="text-neutral-medium text-sm mb-6">
                Aquí podrás acceder al área de socios.
              </p>
              <div class="flex justify-center">
                <button
                  type="button"
                  (click)="goToAssociation()"
                  class="ds-btn ds-btn-primary"
                >
                  Volver
                </button>
              </div>
            </div>
          }
        </section>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssociationMembersPage {
  private readonly contextStore = inject(ContextStore);
  private readonly associationsResolve = inject(AssociationsResolveService);
  private readonly authService = inject(AuthService);
  private readonly userAssociationApi = inject(UserAssociationApiService);
  private readonly memberStatusApi = inject(MemberStatusApiService);
  private readonly router = inject(Router);

  // Estado
  readonly isLoading = signal(true);
  readonly isSubmitting = signal(false);
  readonly userMembership = signal<UserAssociation | null>(null);
  readonly errorMessage = signal('');
  readonly confirmationMessage = signal('');

  readonly associationName = computed(() => {
    const scopeId = this.contextStore.scopeId();
    if (scopeId) {
      const association = this.associationsResolve.getById(scopeId);
      return association?.name;
    }
    return '';
  });

  readonly pageTitle = computed(() => {
    // Durante la carga, mostrar título neutral
    if (this.isLoading()) {
      return 'Socios';
    }
    return this.membershipStatus() === 'not-member' ? 'Solicitar membresía' : 'Socios';
  });

  readonly membershipStatus = computed((): 'not-member' | 'pending' | 'member' | null => {
    const membership = this.userMembership();
    if (!membership) {
      return 'not-member';
    }
    if (membership.status?.type?.id === 1) {
      return 'pending';
    }
    return 'member';
  });

  constructor() {
    // Cargar la membresía del usuario al entrar
    effect(() => {
      const currentUser = this.authService.currentUser();
      const associationId = this.contextStore.scopeId();

      if (currentUser?.id && associationId) {
        this.loadUserMembership(currentUser.id, associationId);
      } else {
        this.isLoading.set(false);
      }
    });
  }

  private loadUserMembership(userId: number, associationId: number): void {
    this.isLoading.set(true);
    this.userAssociationApi
      .getAll({ user_id: userId, association_id: associationId })
      .subscribe({
        next: (memberships) => {
          // Debería haber máximo una membresía por usuario y asociación
          this.userMembership.set(memberships[0] || null);
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
        },
      });
  }

  requestMembership(): void {
    const currentUser = this.authService.currentUser();
    const associationId = this.contextStore.scopeId();

    if (!currentUser?.id || !associationId) {
      this.errorMessage.set('No se pudo procesar la solicitud. Por favor, inténtelo de nuevo.');
      return;
    }

    // Capturar valores para usar dentro de observables
    const userId = currentUser.id;

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const today = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD

    // Primero obtener los estados de solicitud de la asociación
    this.memberStatusApi
      .getAll(associationId, MEMBER_STATUS_TYPES.REQUEST)
      .subscribe({
        next: (statuses) => {
          // Buscar el estado con menor order
          if (statuses.length === 0) {
            this.errorMessage.set(
              'No se pudo procesar tu solicitud. Por favor, vuelve a intentarlo. Si el error persiste, contacta con la asociación.'
            );
            this.isSubmitting.set(false);
            return;
          }

          // Ordenar por order y seleccionar el primero (menor order)
          const selectedStatus = statuses.sort((a, b) => a.order - b.order)[0];

          // Crear la membresía con el status_id correcto
          this.userAssociationApi
            .create({
              user_id: userId,
              association_id: associationId,
              joined_at: today,
              status_id: selectedStatus.id,
            })
            .subscribe({
              next: (membership) => {
                this.userMembership.set(membership);
                this.confirmationMessage.set('Tu solicitud de membresía ha sido enviada correctamente.');
                this.isSubmitting.set(false);
              },
              error: () => {
                // Si hay error, recargar la membresía por si ya existe
                // Esto sincroniza el estado si el registro se creó en otra sesión
                this.loadUserMembership(userId, associationId);
                this.errorMessage.set(
                  'No se pudo procesar tu solicitud. Por favor, vuelve a intentarlo. Si el error persiste, contacta con la asociación.'
                );
                this.isSubmitting.set(false);
              },
            });
        },
        error: () => {
          this.errorMessage.set(
            'No se pudo procesar tu solicitud. Por favor, vuelve a intentarlo. Si el error persiste, contacta con la asociación.'
          );
          this.isSubmitting.set(false);
        },
      });
  }

  goToAssociation(): void {
    const scopeId = this.contextStore.scopeId();
    if (scopeId) {
      const association = this.associationsResolve.getById(scopeId);
      if (association?.slug) {
        this.router.navigate(['/asociaciones', association.slug]);
        return;
      }
    }
    // Fallback: navegar a la lista de asociaciones
    this.router.navigate(['/asociaciones']);
  }
}
