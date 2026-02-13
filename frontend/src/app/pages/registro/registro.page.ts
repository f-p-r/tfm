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
          this.fieldErrors.set(response.errorsList || {});
          if (response.errorsList?.['id']) {
            this.generalError.set(response.errorsList['id']);
          }
          this.isSubmitting.set(false);
        } else {
          // Éxito
          this.success.set(true);
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        }
      },
      error: (error) => {
        this.isSubmitting.set(false);

        // Error 422 con estructura Laravel
        if (error.status === 422 && error.error?.errors) {
          const backendErrors: Record<string, string> = {};
          Object.entries(error.error.errors).forEach(([field, messages]) => {
            backendErrors[field] = (messages as string[])[0];
          });
          this.fieldErrors.set(backendErrors);
        } else {
          this.generalError.set('Ha ocurrido un error. Por favor, inténtalo de nuevo.');
        }
      },
    });
  }

  getFieldError(field: string): string | null {
    return this.fieldErrors()[field] || null;
  }
}
