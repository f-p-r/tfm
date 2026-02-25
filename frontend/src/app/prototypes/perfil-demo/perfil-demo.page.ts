import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { HelpIComponent } from '../../shared/help/help-i/help-i.component';
import { HelpHoverDirective } from '../../shared/help/help-hover.directive';
import { HelpContentService } from '../../shared/help/help-content.service';
import { PageHelpService } from '../../shared/help/page-help.service';
import { PERFIL_HELP } from '../../pages/perfil/perfil.help';
import { PERFIL_PAGE_HELP } from '../../shared/help/page-content/perfil.help';

/** Datos de usuario de ejemplo para el prototipo */
const MOCK_USER = {
  username: 'demo_user',
  name: 'Ana García',
  email: 'ana.garcia@ejemplo.com',
  createdAt: new Date('2025-03-12T10:30:00'),
};

/**
 * Prototipo: página de perfil de usuario (/perfil).
 * Réplica visual exacta con ayuda contextual completa y sin llamadas API.
 */
@Component({
  selector: 'app-perfil-demo',
  imports: [ReactiveFormsModule, DatePipe, HelpIComponent, HelpHoverDirective],
  template: `
    <div class="ds-main">
      <div class="ds-page">
        <div class="ds-container-narrow">

          <!-- Header -->
          <div class="mb-8">
            <h1 class="h2">Mi perfil</h1>
            <p class="text-sm text-neutral-medium mt-2">
              Gestiona tu información personal y seguridad
            </p>
            <p class="text-xs uppercase tracking-widest text-neutral-dark/50 mt-1">
              Prototipo · ayuda contextual activa
            </p>
          </div>

          <!-- Mensajes globales -->
          @if (successMessage()) {
            <div class="ds-alert ds-alert-success mb-6">
              {{ successMessage() }}
            </div>
          }
          @if (generalError()) {
            <div class="ds-alert ds-alert-error mb-6">
              {{ generalError() }}
            </div>
          }

          <!-- Información de cuenta (read-only) -->
          <div class="bg-white border border-neutral-medium rounded-lg p-6 shadow-sm mb-6">
            <h2 class="h3 mb-4">Información de cuenta</h2>
            <div class="space-y-3">
              <div>
                <p class="text-sm font-semibold text-neutral-medium">Nombre de usuario</p>
                <p class="text-neutral-dark">{{ mockUser.username }}</p>
              </div>
              <div>
                <p class="text-sm font-semibold text-neutral-medium">Fecha de registro</p>
                <p class="text-neutral-dark">{{ mockUser.createdAt | date:'dd/MM/yyyy HH:mm' }}</p>
              </div>
            </div>
          </div>

          <!-- Sección: Datos personales -->
          <div class="bg-white border border-neutral-medium rounded-lg p-6 shadow-sm mb-6">
            <h2 class="h3 mb-4">Datos personales</h2>

            <form [formGroup]="dataForm" (ngSubmit)="onUpdateData()" class="space-y-6">

              <!-- Nombre -->
              <div class="ds-field">
                <div class="ds-label-with-help">
                  <label for="name" class="ds-label">Nombre completo</label>
                  <app-help-i helpKey="name" />
                </div>
                <input
                  id="name"
                  formControlName="name"
                  type="text"
                  required
                  helpHover
                  helpKey="name"
                  class="ds-input"
                  [class.ds-control-error]="getFieldError('name')"
                />
                @if (getFieldError('name')) {
                  <p class="ds-error">{{ getFieldError('name') }}</p>
                }
              </div>

              <!-- Email -->
              <div class="ds-field">
                <div class="ds-label-with-help">
                  <label for="email" class="ds-label">Email</label>
                  <app-help-i helpKey="email" />
                </div>
                <input
                  id="email"
                  formControlName="email"
                  type="email"
                  required
                  helpHover
                  helpKey="email"
                  class="ds-input"
                  [class.ds-control-error]="getFieldError('email')"
                />
                @if (getFieldError('email')) {
                  <p class="ds-error">{{ getFieldError('email') }}</p>
                }
              </div>

              <div class="flex justify-end">
                <button
                  type="submit"
                  class="ds-btn"
                  [class.ds-btn-primary]="dataForm.valid && !isSavingData()"
                  [class.ds-btn-disabled]="dataForm.invalid || isSavingData()"
                  [disabled]="dataForm.invalid || isSavingData()"
                >
                  {{ isSavingData() ? 'Guardando...' : 'Guardar cambios' }}
                </button>
              </div>
            </form>
          </div>

          <!-- Sección: Cambiar contraseña -->
          <div class="bg-white border border-neutral-medium rounded-lg p-6 shadow-sm">
            <h2 class="h3 mb-4">Cambiar contraseña</h2>

            <form [formGroup]="passwordForm" (ngSubmit)="onUpdatePassword()" class="space-y-6">

              <!-- Nueva contraseña -->
              <div class="ds-field">
                <div class="ds-label-with-help">
                  <label for="password" class="ds-label">Nueva contraseña</label>
                  <app-help-i helpKey="password" />
                </div>
                <input
                  id="password"
                  formControlName="password"
                  type="password"
                  required
                  helpHover
                  helpKey="password"
                  class="ds-input"
                  [class.ds-control-error]="getFieldError('password')"
                />
                @if (getFieldError('password')) {
                  <p class="ds-error">{{ getFieldError('password') }}</p>
                }
                <p class="ds-help">Mínimo 8 caracteres</p>
              </div>

              <!-- Confirmar contraseña -->
              <div class="ds-field">
                <div class="ds-label-with-help">
                  <label for="passwordConfirmation" class="ds-label">Confirmar contraseña</label>
                  <app-help-i helpKey="passwordConfirmation" />
                </div>
                <input
                  id="passwordConfirmation"
                  formControlName="passwordConfirmation"
                  type="password"
                  required
                  helpHover
                  helpKey="passwordConfirmation"
                  class="ds-input"
                  [class.ds-control-error]="getFieldError('passwordConfirmation')"
                />
                @if (getFieldError('passwordConfirmation')) {
                  <p class="ds-error">{{ getFieldError('passwordConfirmation') }}</p>
                }
              </div>

              <div class="flex justify-end">
                <button
                  type="submit"
                  class="ds-btn"
                  [class.ds-btn-primary]="passwordForm.valid && !isSavingPassword()"
                  [class.ds-btn-disabled]="passwordForm.invalid || isSavingPassword()"
                  [disabled]="passwordForm.invalid || isSavingPassword()"
                >
                  {{ isSavingPassword() ? 'Actualizando...' : 'Cambiar contraseña' }}
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PerfilDemoPage {
  private readonly helpContent = inject(HelpContentService);
  private readonly fb = inject(FormBuilder);

  protected readonly mockUser = MOCK_USER;

  readonly successMessage = signal<string | null>(null);
  readonly generalError = signal<string | null>(null);
  readonly fieldErrors = signal<Record<string, string>>({});
  readonly isSavingData = signal(false);
  readonly isSavingPassword = signal(false);

  readonly dataForm = this.fb.nonNullable.group({
    name: [MOCK_USER.name, [Validators.required]],
    email: [MOCK_USER.email, [Validators.required, Validators.email]],
  });

  readonly passwordForm = this.fb.nonNullable.group({
    password: ['', [Validators.required, Validators.minLength(8)]],
    passwordConfirmation: ['', [Validators.required]],
  });

  constructor() {
    inject(PageHelpService).set(PERFIL_PAGE_HELP);
    this.helpContent.setPack(PERFIL_HELP);
  }

  protected getFieldError(field: string): string | null {
    return this.fieldErrors()[field] ?? null;
  }

  protected onUpdateData(): void {
    if (this.dataForm.invalid || this.isSavingData()) return;
    this.clearMessages();
    this.isSavingData.set(true);
    setTimeout(() => {
      this.isSavingData.set(false);
      this.successMessage.set('Datos actualizados correctamente');
      setTimeout(() => this.successMessage.set(null), 3000);
    }, 800);
  }

  protected onUpdatePassword(): void {
    if (this.passwordForm.invalid || this.isSavingPassword()) return;
    const { password, passwordConfirmation } = this.passwordForm.getRawValue();
    if (password !== passwordConfirmation) {
      this.fieldErrors.set({ passwordConfirmation: 'Las contraseñas no coinciden' });
      return;
    }
    this.clearMessages();
    this.isSavingPassword.set(true);
    setTimeout(() => {
      this.isSavingPassword.set(false);
      this.passwordForm.reset();
      this.successMessage.set('Contraseña actualizada correctamente');
      setTimeout(() => this.successMessage.set(null), 3000);
    }, 800);
  }

  private clearMessages(): void {
    this.successMessage.set(null);
    this.generalError.set(null);
    this.fieldErrors.set({});
  }
}
