/**
 * Modal de gestión de roles de usuario.
 *
 * Permite:
 * - Ver, crear, editar y eliminar asignaciones de roles
 * - Restablecer contraseña del usuario
 *
 * Organizado en pestañas:
 * - Roles: Gestión completa de role grants
 * - Acciones: Operaciones sobre el usuario
 */

import { Component, input, output, signal, computed, effect, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RoleGrantApiService } from '../../../../core/authz/role-grant-api.service';
import { AssociationsApiService } from '../../../../core/associations/associations-api.service';
import { GamesApiService } from '../../../../core/games/games-api.service';
import { RoleGrant, ROLES, SCOPE_TYPES, SCOPE_ALL_OPTION } from '../../../../core/authz/role-grant.models';
import { Association } from '../../../../core/associations/associations.models';
import { Game } from '../../../../core/games/games.models';
import { HelpContentService } from '../../../../shared/help/help-content.service';
import { HelpIComponent } from '../../../../shared/help/help-i/help-i.component';
import { HelpHoverDirective } from '../../../../shared/help/help-hover.directive';
import { USER_ROLE_MANAGEMENT_HELP } from './user-role-management-modal.help';

type ViewMode = 'table' | 'form';
type FormMode = 'create' | 'edit';
type Tab = 'roles' | 'actions';

@Component({
  selector: 'app-user-role-management-modal',
  standalone: true,
  imports: [ReactiveFormsModule, HelpIComponent, HelpHoverDirective],
  styles: [],
  template: `
    <div class="ds-modal-backdrop">
      <div class="ds-modal-content">
        <!-- Modal Header -->
        <div class="px-6 py-4 border-b border-neutral-medium">
          <h2 class="h3">Usuario {{ username() }}</h2>

          <!-- Pestañas -->
          <div class="ds-tabs mt-4">
            <button
              type="button"
              class="ds-tab"
              [class.ds-tab-active]="activeTab() === 'roles'"
              (click)="activeTab.set('roles')"
            >
              Roles
            </button>
            <button
              type="button"
              class="ds-tab"
              [class.ds-tab-active]="activeTab() === 'actions'"
              (click)="activeTab.set('actions')"
            >
              Acciones
            </button>
          </div>
        </div>

        <!-- Modal Body -->
        <div class="px-6 py-4">

          <!-- Mensaje de éxito -->
          @if (successMessage()) {
            <div class="ds-alert ds-alert-success mb-4">
              {{ successMessage() }}
            </div>
          }

          <!-- Error general -->
          @if (serverError()) {
            <div class="ds-alert ds-alert-error mb-4">
              {{ serverError() }}
            </div>
          }

          <!-- Pestaña: Roles -->
          @if (activeTab() === 'roles') {

            <!-- Vista: Tabla de roles -->
            @if (viewMode() === 'table') {
              <div class="space-y-4">
                <div class="flex justify-end">
                  <button type="button" class="ds-btn ds-btn-primary" (click)="onCreateRole()">
                    Nuevo rol
                  </button>
                </div>

                <!-- Tabla -->
                @if (isLoadingRoles()) {
                  <div class="text-center py-8 text-neutral-500">Cargando roles...</div>
                } @else if (roleGrants().length === 0) {
                  <div class="text-center py-8 text-neutral-500">No hay roles asignados.</div>
                } @else {
                  <div class="ds-table-container">
                    <table class="ds-table">
                      <thead>
                        <tr>
                          <th>Rol</th>
                          <th>Tipo de Ámbito</th>
                          <th>Ámbito</th>
                          <th class="text-center">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (grant of roleGrants(); track grant.id) {
                          <tr>
                            <td>{{ grant.role.name }}</td>
                            <td>{{ grant.scope_type.name }}</td>
                            <td>{{ grant.scope?.name || 'Todos' }}</td>
                            <td class="text-center">
                              <button type="button" class="ds-btn-sm ds-btn-primary" (click)="onEditRole(grant)">
                                Editar
                              </button>
                              <button type="button" class="ds-btn-sm ds-btn-danger ml-2" (click)="onDeleteRole(grant)">
                                Borrar
                              </button>
                            </td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                }
              </div>
            }

            <!-- Vista: Formulario de crear/editar rol -->
            @if (viewMode() === 'form') {
              <form [formGroup]="form" (ngSubmit)="onSubmitForm()">
                <div class="space-y-4">

                  <h3 class="h3 mb-4">{{ formMode() === 'create' ? 'Nuevo Rol' : 'Editar Rol' }}</h3>

                  <!-- Rol -->
                  <div class="ds-field">
                    <label for="role" class="ds-label">
                      Rol *
                      <app-help-i helpKey="role"></app-help-i>
                    </label>
                    <select
                      id="role"
                      formControlName="role_id"
                      class="ds-select"
                      helpHover
                      helpKey="role"
                      [class.ds-control-error]="form.get('role_id')?.invalid && form.get('role_id')?.touched"
                    >
                      <option [value]="null">Selecciona un rol</option>
                      @for (role of roles; track role.id) {
                        <option [value]="role.id">{{ role.name }}</option>
                      }
                    </select>
                    @if (form.get('role_id')?.hasError('required') && form.get('role_id')?.touched) {
                      <span class="ds-error">El rol es obligatorio</span>
                    }
                  </div>

                  <!-- Tipo de Ámbito -->
                  <div class="ds-field">
                    <label for="scopeType" class="ds-label">
                      Tipo de Ámbito *
                      <app-help-i helpKey="scopeType"></app-help-i>
                    </label>
                    <select
                      id="scopeType"
                      formControlName="scope_type"
                      class="ds-select"
                      helpHover
                      helpKey="scopeType"
                      [class.ds-control-error]="form.get('scope_type')?.invalid && form.get('scope_type')?.touched"
                    >
                      <option [value]="null">Selecciona un tipo</option>
                      @for (type of scopeTypes; track type.id) {
                        <option [value]="type.id">{{ type.name }}</option>
                      }
                    </select>
                    @if (form.get('scope_type')?.hasError('required') && form.get('scope_type')?.touched) {
                      <span class="ds-error">El tipo de ámbito es obligatorio</span>
                    }
                  </div>

                  <!-- Ámbito -->
                  <div class="ds-field">
                    <label for="scope" class="ds-label">
                      Ámbito *
                      <app-help-i helpKey="scope"></app-help-i>
                    </label>
                    <select
                      id="scope"
                      formControlName="scope_id"
                      class="ds-select ds-select-scrollable"
                      helpHover
                      helpKey="scope"
                      [disabled]="!selectedScopeType()"
                      [class.ds-control-error]="form.get('scope_id')?.invalid && form.get('scope_id')?.touched"
                    >
                      @if (!selectedScopeType()) {
                        <option [value]="null">Primero selecciona un tipo de ámbito</option>
                      } @else {
                        <option [value]="null">{{ scopeAllOption.name }}</option>
                        @for (option of filteredScopeOptions(); track option.id) {
                          <option [value]="option.id">{{ option.name }}</option>
                        }
                      }
                    </select>
                  </div>

                  <!-- Botones -->
                  <div class="flex justify-end gap-3 pt-4">
                    <button type="button" class="ds-btn" (click)="onCancelForm()">
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      class="ds-btn ds-btn-primary"
                      [disabled]="form.invalid || isSubmitting()"
                    >
                      {{ isSubmitting() ? 'Guardando...' : 'Guardar' }}
                    </button>
                  </div>
                </div>
              </form>
            }
          }

          <!-- Pestaña: Acciones -->
          @if (activeTab() === 'actions') {
            <div class="space-y-4">
              <div class="ds-field">
                <label class="ds-label">
                  Restablecer Contraseña
                  <app-help-i helpKey="resetPassword"></app-help-i>
                </label>
                <p class="text-sm text-neutral-500 mb-3" helpHover helpKey="resetPassword">
                  Se generará una nueva contraseña temporal y se enviará al usuario por correo electrónico.
                </p>
                <button type="button" class="ds-btn ds-btn-primary" (click)="onResetPassword()">
                  Restablecer contraseña
                </button>
              </div>
            </div>
          }

        </div>

        <!-- Modal Footer -->
        <div class="px-6 py-4 border-t border-neutral-medium flex justify-end">
          <button type="button" class="ds-btn" (click)="onClose()">
            Cerrar
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de confirmación de borrado -->
    @if (showDeleteConfirmation()) {
      <div class="ds-modal-backdrop" style="z-index: 1001;">
        <div class="ds-modal-content max-w-md">
          <div class="px-6 py-4 border-b border-neutral-medium">
            <h3 class="h3">Confirmar eliminación</h3>
          </div>
          <div class="px-6 py-4">
            <p>¿Estás seguro de que quieres eliminar este rol?</p>
            @if (roleToDelete()) {
              <div class="mt-3 p-3 bg-neutral-light rounded">
                <p class="text-sm"><strong>Rol:</strong> {{ roleToDelete()!.role.name }}</p>
                <p class="text-sm"><strong>Tipo:</strong> {{ roleToDelete()!.scope_type.name }}</p>
                <p class="text-sm"><strong>Ámbito:</strong> {{ roleToDelete()!.scope?.name || 'Todos' }}</p>
              </div>
            }
          </div>
          <div class="px-6 py-4 border-t border-neutral-medium flex justify-end gap-3">
            <button type="button" class="ds-btn" (click)="onCancelDelete()">
              Cancelar
            </button>
            <button type="button" class="ds-btn ds-btn-danger" (click)="onConfirmDelete()">
              Eliminar
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class UserRoleManagementModalComponent {
  private readonly fb = inject(FormBuilder);
  private readonly helpContent = inject(HelpContentService);
  private readonly roleGrantApi = inject(RoleGrantApiService);
  private readonly associationsApi = inject(AssociationsApiService);
  private readonly gamesApi = inject(GamesApiService);

  // Inputs
  readonly userId = input.required<number>();
  readonly username = input.required<string>();

  // Outputs
  readonly close = output<void>();
  readonly resetPassword = output<void>();
  readonly roleChanged = output<void>();

  // Estado de pestañas
  protected readonly activeTab = signal<Tab>('roles');

  // Estado de vista (tabla o formulario)
  protected readonly viewMode = signal<ViewMode>('table');
  protected readonly formMode = signal<FormMode>('create');

  // Datos
  protected readonly roleGrants = signal<RoleGrant[]>([]);
  protected readonly associations = signal<Association[]>([]);
  protected readonly games = signal<Game[]>([]);

  // Estados de carga
  protected readonly isLoadingRoles = signal(false);
  protected readonly isSubmitting = signal(false);

  // Mensajes
  protected readonly serverError = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);

  // Modal de confirmación de borrado
  protected readonly showDeleteConfirmation = signal(false);
  protected readonly roleToDelete = signal<RoleGrant | null>(null);

  // Catálogos
  protected readonly roles = ROLES;
  protected readonly scopeTypes = SCOPE_TYPES;
  protected readonly scopeAllOption = SCOPE_ALL_OPTION;

  // Signal para el scope_type seleccionado (necesario para que computed funcione)
  protected readonly selectedScopeType = signal<number | null>(null);

  // Opciones de scope filtradas según el tipo seleccionado
  protected readonly filteredScopeOptions = computed(() => {
    const scopeType = this.selectedScopeType();
    const associations = this.associations();
    const games = this.games();

    // Convertir a número para comparación
    const scopeTypeNum = scopeType ? Number(scopeType) : null;

    if (scopeTypeNum === 1) return []; // Global: solo "Todos"
    if (scopeTypeNum === 2) return associations; // Asociaciones
    if (scopeTypeNum === 3) return games; // Juegos
    return [];
  });

  // Formulario
  protected readonly form: FormGroup;

  // ID del role grant en edición
  private editingRoleGrantId: number | null = null;

  constructor() {
    // Establecer pack de ayuda
    this.helpContent.setPack(USER_ROLE_MANAGEMENT_HELP);

    // Inicializar formulario
    this.form = this.fb.group({
      role_id: [null, [Validators.required]],
      scope_type: [null, [Validators.required]],
      scope_id: [null]
    });

    // Limpiar scope_id cuando cambia scope_type
    this.form.get('scope_type')?.valueChanges.subscribe((value) => {
      this.selectedScopeType.set(value);
      this.form.patchValue({ scope_id: null });
    });

    // Cargar datos cuando cambie el userId
    effect(() => {
      const id = this.userId();
      if (id) {
        this.loadRoleGrants();
        this.loadAssociations();
        this.loadGames();
      }
    });
  }

  private loadRoleGrants() {
    this.isLoadingRoles.set(true);
    this.serverError.set(null);
    // NO limpiar successMessage aquí para que se muestre después de operaciones CRUD

    this.roleGrantApi.getAll(this.userId()).subscribe({
      next: (data) => {
        this.roleGrants.set(data);
        this.isLoadingRoles.set(false);
      },
      error: (err) => {
        this.serverError.set(err.error?.message || 'Error al cargar los roles');
        this.isLoadingRoles.set(false);
      }
    });
  }

  private loadAssociations() {
    this.associationsApi.getAll().subscribe({
      next: (data) => {
        this.associations.set(data);
      },
      error: (err) => {
        console.error('Error al cargar asociaciones:', err);
      }
    });
  }

  private loadGames() {
    this.gamesApi.getGames().subscribe({
      next: (data: Game[]) => {
        this.games.set(data);
      },
      error: (err) => {
        console.error('Error al cargar juegos:', err);
      }
    });
  }

  protected onCreateRole() {
    this.editingRoleGrantId = null;
    this.formMode.set('create');
    this.form.reset();
    this.selectedScopeType.set(null);
    this.serverError.set(null);
    this.successMessage.set(null);
    this.viewMode.set('form');
  }

  protected onEditRole(grant: RoleGrant) {
    this.editingRoleGrantId = grant.id;
    this.formMode.set('edit');
    this.form.patchValue({
      role_id: grant.role.id,
      scope_type: grant.scope_type.value,
      scope_id: grant.scope?.id || null
    });
    this.selectedScopeType.set(grant.scope_type.value);
    this.serverError.set(null);
    this.successMessage.set(null);
    this.viewMode.set('form');
  }

  protected onDeleteRole(grant: RoleGrant) {
    this.roleToDelete.set(grant);
    this.showDeleteConfirmation.set(true);
  }

  protected onCancelDelete() {
    this.roleToDelete.set(null);
    this.showDeleteConfirmation.set(false);
  }

  protected onConfirmDelete() {
    const grant = this.roleToDelete();
    if (!grant) return;

    this.roleGrantApi.delete(grant.id).subscribe({
      next: () => {
        this.showDeleteConfirmation.set(false);
        this.roleToDelete.set(null);
        this.successMessage.set('Rol eliminado correctamente');
        this.loadRoleGrants();
        this.roleChanged.emit();
      },
      error: (err) => {
        this.serverError.set(err.error?.message || 'Error al eliminar el rol');
        this.showDeleteConfirmation.set(false);
        this.roleToDelete.set(null);
      }
    });
  }

  protected onCancelForm() {
    this.viewMode.set('table');
    this.form.reset();
    this.selectedScopeType.set(null);
    this.serverError.set(null);
    this.successMessage.set(null);
  }

  protected onSubmitForm() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.serverError.set(null);

    const formData = {
      user_id: this.userId(),
      role_id: this.form.value.role_id,
      scope_type: this.form.value.scope_type,
      scope_id: this.form.value.scope_id
    };

    const apiCall = this.formMode() === 'create'
      ? this.roleGrantApi.create(formData)
      : this.roleGrantApi.update(this.editingRoleGrantId!, formData);

    apiCall.subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.viewMode.set('table');
        this.form.reset();
        const message = this.formMode() === 'create'
          ? 'Rol creado correctamente'
          : 'Rol actualizado correctamente';
        this.successMessage.set(message);
        this.loadRoleGrants();
        this.roleChanged.emit();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.serverError.set(err.error?.message || 'Error al guardar el rol');
      }
    });
  }

  protected onResetPassword() {
    this.resetPassword.emit();
  }

  protected onClose() {
    this.close.emit();
  }
}
