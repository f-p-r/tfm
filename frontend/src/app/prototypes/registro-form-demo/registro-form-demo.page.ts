import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HelpIComponent } from '../../shared/help/help-i/help-i.component';
import { HelpHoverDirective } from '../../shared/help/help-hover.directive';
import { HelpContentService } from '../../shared/help/help-content.service';
import { PageHelpService } from '../../shared/help/page-help.service';
import { REGISTRO_FORM_PACK } from '../../pages/registro/registro-form.pack';
import { REGISTRO_PAGE_HELP } from '../../shared/help/page-content/registro-form.help';

/**
 * Prototipo: formulario de registro de nuevo usuario.
 * Equivalente a RegistroPage pero con ayuda contextual completa.
 * Sin llamadas reales a API.
 */
@Component({
  selector: 'app-registro-form-demo',
  imports: [ReactiveFormsModule, HelpIComponent, HelpHoverDirective],
  template: `
    <div class="ds-main flex items-center justify-center px-4">
      <div class="ds-container-narrow py-10">

        <!-- Título -->
        <div class="text-center mb-8">
          <h1 class="h2">Crear cuenta</h1>
          <p class="text-sm text-neutral-medium mt-2">
            Completa el formulario para registrarte
          </p>
          <p class="text-xs uppercase tracking-widest text-neutral-dark/50 mt-1">
            Prototipo · ayuda contextual activa
          </p>
        </div>

        <!-- Tarjeta del formulario -->
        <div class="bg-white border border-neutral-medium rounded-lg p-6 shadow-sm">

          <!-- Mensaje de éxito -->
          @if (success()) {
            <div class="ds-alert ds-alert-success mb-6">
              ¡Cuenta creada exitosamente! Redirigiendo a inicio de sesión...
            </div>
          }

          <!-- Error general -->
          @if (generalError()) {
            <div class="ds-alert ds-alert-error mb-6">
              {{ generalError() }}
            </div>
          }

          <!-- Formulario -->
          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-6">

            <!-- Nombre completo -->
            <div class="ds-field">
              <div class="ds-label-with-help">
                <label for="name" class="ds-label">Nombre completo</label>
                <app-help-i helpKey="name" />
              </div>
              <input
                id="name"
                type="text"
                formControlName="name"
                class="ds-input"
                helpHover
                helpKey="name"
                [class.ds-control-error]="getFieldError('name')"
                placeholder="Ej: Juan Pérez"
              />
              @if (getFieldError('name')) {
                <p class="ds-error">{{ getFieldError('name') }}</p>
              }
            </div>

            <!-- Nombre de usuario -->
            <div class="ds-field">
              <div class="ds-label-with-help">
                <label for="username" class="ds-label">Nombre de usuario</label>
                <app-help-i helpKey="username" />
              </div>
              <input
                id="username"
                type="text"
                formControlName="username"
                class="ds-input"
                helpHover
                helpKey="username"
                [class.ds-control-error]="getFieldError('username')"
                placeholder="Ej: jperez"
              />
              @if (getFieldError('username')) {
                <p class="ds-error">{{ getFieldError('username') }}</p>
              }
              <p class="ds-help">
                Será visible públicamente. Solo letras, números y guiones.
              </p>
            </div>

            <!-- Email -->
            <div class="ds-field">
              <div class="ds-label-with-help">
                <label for="email" class="ds-label">Email</label>
                <app-help-i helpKey="email" />
              </div>
              <input
                id="email"
                type="email"
                formControlName="email"
                class="ds-input"
                helpHover
                helpKey="email"
                [class.ds-control-error]="getFieldError('email')"
                placeholder="ejemplo@email.com"
              />
              @if (getFieldError('email')) {
                <p class="ds-error">{{ getFieldError('email') }}</p>
              }
            </div>

            <!-- Contraseña -->
            <div class="ds-field">
              <div class="ds-label-with-help">
                <label for="password" class="ds-label">Contraseña</label>
                <app-help-i helpKey="password" />
              </div>
              <input
                id="password"
                type="password"
                formControlName="password"
                class="ds-input"
                helpHover
                helpKey="password"
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
                type="password"
                formControlName="passwordConfirmation"
                class="ds-input"
                helpHover
                helpKey="passwordConfirmation"
                [class.ds-control-error]="getFieldError('passwordConfirmation')"
              />
              @if (getFieldError('passwordConfirmation')) {
                <p class="ds-error">{{ getFieldError('passwordConfirmation') }}</p>
              }
            </div>

            <!-- Botón submit -->
            <button
              type="submit"
              class="ds-btn w-full"
              [class.ds-btn-primary]="!isSubmitting() && !success() && form.valid"
              [class.ds-btn-disabled]="form.invalid || isSubmitting() || success()"
              [disabled]="form.invalid || isSubmitting() || success()"
            >
              @if (isSubmitting()) {
                Creando cuenta...
              } @else if (success()) {
                ✓ Cuenta creada
              } @else {
                Crear cuenta
              }
            </button>
          </form>

          <!-- Separador -->
          <div class="relative my-6">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-neutral-medium"></div>
            </div>
          </div>

          <!-- Link a login -->
          <div class="text-center">
            <p class="text-sm text-neutral-medium mb-3">¿Ya tienes cuenta?</p>
            <button
              type="button"
              class="ds-btn ds-btn-secondary w-full"
              (click)="resetForm()"
            >
              Iniciar sesión (demo)
            </button>
          </div>

        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegistroFormDemoPage {
  private readonly helpContent = inject(HelpContentService);
  private readonly pageHelp = inject(PageHelpService);
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    username: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    passwordConfirmation: ['', [Validators.required]],
  });

  readonly generalError = signal<string | null>(null);
  readonly fieldErrors = signal<Record<string, string>>({});
  readonly isSubmitting = signal(false);
  readonly success = signal(false);

  constructor() {
    this.helpContent.setPack(REGISTRO_FORM_PACK);
    this.pageHelp.set(REGISTRO_PAGE_HELP);
  }

  protected getFieldError(field: string): string | null {
    return this.fieldErrors()[field] ?? null;
  }

  protected onSubmit(): void {
    if (this.form.invalid || this.isSubmitting()) return;

    const { password, passwordConfirmation } = this.form.getRawValue();
    if (password !== passwordConfirmation) {
      this.fieldErrors.set({ passwordConfirmation: 'Las contraseñas no coinciden' });
      return;
    }

    this.generalError.set(null);
    this.fieldErrors.set({});
    this.isSubmitting.set(true);

    // Simular llamada a API
    setTimeout(() => {
      this.isSubmitting.set(false);
      this.success.set(true);
      setTimeout(() => this.resetForm(), 2500);
    }, 900);
  }

  protected resetForm(): void {
    this.form.reset();
    this.success.set(false);
    this.generalError.set(null);
    this.fieldErrors.set({});
  }
}
