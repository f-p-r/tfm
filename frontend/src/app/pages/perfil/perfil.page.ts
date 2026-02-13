import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import { UsersService } from '../../core/users/users.service';

@Component({
  selector: 'app-perfil-page',
  imports: [ReactiveFormsModule],
  templateUrl: './perfil.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PerfilPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly usersService = inject(UsersService);

  readonly user = this.authService.currentUser;
  readonly isLoading = signal(false);
  readonly successMessage = signal<string | null>(null);
  readonly generalError = signal<string | null>(null);
  readonly fieldErrors = signal<Record<string, string>>({});

  // Formulario de datos básicos
  readonly dataForm = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
  });

  // Formulario de contraseña
  readonly passwordForm = this.fb.nonNullable.group({
    password: ['', [Validators.required, Validators.minLength(8)]],
    passwordConfirmation: ['', [Validators.required]],
  });

  ngOnInit(): void {
    const currentUser = this.user();
    if (currentUser) {
      this.dataForm.patchValue({
        name: currentUser.name,
        email: currentUser.email,
      });
    }
  }

  onUpdateData(): void {
    if (this.dataForm.invalid || this.isLoading()) {
      return;
    }

    const currentUser = this.user();
    if (!currentUser || !currentUser.id) {
      this.generalError.set('No se pudo obtener la información del usuario');
      return;
    }

    this.clearMessages();
    this.isLoading.set(true);

    const { name, email } = this.dataForm.getRawValue();

    this.usersService.update(currentUser.id, { name, email }).subscribe({
      next: (response) => {
        this.isLoading.set(false);

        if (response.errors) {
          this.handleErrors(response.errorsList || {});
        } else if (response.data) {
          // Actualizar el signal del AuthService con los nuevos datos
          this.authService.currentUser.set(response.data);
          this.successMessage.set('Datos actualizados correctamente');
          this.scrollToTop();
        }
      },
      error: (error) => {
        this.isLoading.set(false);
        this.handleHttpError(error);
      },
    });
  }

  onUpdatePassword(): void {
    if (this.passwordForm.invalid || this.isLoading()) {
      return;
    }

    const { password, passwordConfirmation } = this.passwordForm.getRawValue();

    if (password !== passwordConfirmation) {
      this.fieldErrors.set({ passwordConfirmation: 'Las contraseñas no coinciden' });
      return;
    }

    const currentUser = this.user();
    if (!currentUser || !currentUser.id) {
      this.generalError.set('No se pudo obtener la información del usuario');
      return;
    }

    this.clearMessages();
    this.isLoading.set(true);

    this.usersService.update(currentUser.id, { password }).subscribe({
      next: (response) => {
        this.isLoading.set(false);

        if (response.errors) {
          this.handleErrors(response.errorsList || {});
        } else {
          this.successMessage.set('Contraseña actualizada correctamente');
          this.passwordForm.reset();
          this.scrollToTop();
        }
      },
      error: (error) => {
        this.isLoading.set(false);
        this.handleHttpError(error);
      },
    });
  }

  getFieldError(field: string): string | null {
    return this.fieldErrors()[field] || null;
  }

  private handleErrors(errors: Record<string, string>): void {
    this.fieldErrors.set(errors);
    if (errors['id']) {
      this.generalError.set(errors['id']);
    }
  }

  private handleHttpError(error: any): void {
    if (error.status === 422 && error.error?.errors) {
      const backendErrors: Record<string, string> = {};
      Object.entries(error.error.errors).forEach(([field, messages]) => {
        backendErrors[field] = (messages as string[])[0];
      });
      this.fieldErrors.set(backendErrors);
    } else {
      this.generalError.set('Ha ocurrido un error. Por favor, inténtalo de nuevo.');
    }
  }

  private clearMessages(): void {
    this.successMessage.set(null);
    this.generalError.set(null);
    this.fieldErrors.set({});
  }

  private scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
