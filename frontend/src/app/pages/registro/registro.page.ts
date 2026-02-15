import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UsersService } from '../../core/users/users.service';

@Component({
  selector: 'app-registro-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './registro.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegistroPage {
  private readonly fb = inject(FormBuilder);
  private readonly usersService = inject(UsersService);
  private readonly router = inject(Router);

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

  onSubmit(): void {
    if (this.form.invalid || this.isSubmitting()) {
      return;
    }

    // Validar que las contraseñas coincidan
    const { password, passwordConfirmation } = this.form.getRawValue();
    if (password !== passwordConfirmation) {
      this.fieldErrors.set({ passwordConfirmation: 'Las contraseñas no coinciden' });
      return;
    }

    this.generalError.set(null);
    this.fieldErrors.set({});
    this.isSubmitting.set(true);

    const { name, username, email } = this.form.getRawValue();

    this.usersService.create({ name, username, email, password }).subscribe({
      next: (response) => {
        if (response.errors) {
          // Errores de validación del backend
          this.isSubmitting.set(false);

          // Separar errores de campo vs errores generales
          const formFields = ['name', 'username', 'email', 'password', 'passwordConfirmation'];
          const fieldErrs: Record<string, string> = {};
          const generalErrs: string[] = [];

          Object.entries(response.errorsList || {}).forEach(([field, message]) => {
            if (formFields.includes(field)) {
              fieldErrs[field] = message as string;
            } else {
              // Cualquier error que no sea un campo específico, mostrarlo como general
              generalErrs.push(message as string);
            }
          });

          this.fieldErrors.set(fieldErrs);

          if (generalErrs.length > 0) {
            this.generalError.set(generalErrs.join('. '));
          }
        } else {
          // Éxito
          this.success.set(true);
          setTimeout(() => {
            this.router.navigate(['/login'], {
              queryParams: { newUser: username }
            });
          }, 2000);
        }
      },
      error: (errorResponse) => {
        this.isSubmitting.set(false);

        // Formato 1: {errors: true, errorsList: {...}} en el body del error
        if (errorResponse.error?.errors === true && errorResponse.error?.errorsList) {
          const formFields = ['name', 'username', 'email', 'password', 'passwordConfirmation'];
          const fieldErrs: Record<string, string> = {};
          const generalErrs: string[] = [];

          Object.entries(errorResponse.error.errorsList).forEach(([field, message]) => {
            if (formFields.includes(field)) {
              fieldErrs[field] = message as string;
            } else {
              generalErrs.push(message as string);
            }
          });

          this.fieldErrors.set(fieldErrs);
          if (generalErrs.length > 0) {
            this.generalError.set(generalErrs.join('. '));
          }
        }
        // Formato 2: Error 422 con estructura Laravel (errors como array de mensajes)
        else if (errorResponse.status === 422 && errorResponse.error?.errors) {
          const backendErrors: Record<string, string> = {};
          Object.entries(errorResponse.error.errors).forEach(([field, messages]) => {
            backendErrors[field] = (messages as string[])[0];
          });
          this.fieldErrors.set(backendErrors);
        }
        // Formato 3: Mensaje genérico
        else {
          this.generalError.set('Ha ocurrido un error. Por favor, inténtalo de nuevo.');
        }
      },
    });
  }

  getFieldError(field: string): string | null {
    return this.fieldErrors()[field] || null;
  }
}
