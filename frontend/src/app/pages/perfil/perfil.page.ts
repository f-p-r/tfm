import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { AuthService } from '../../core/auth/auth.service';
import { UsersService } from '../../core/users/users.service';
import { User } from '../../core/auth/user.model';

@Component({
  selector: 'app-perfil-page',
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './perfil.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PerfilPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly usersService = inject(UsersService);

  readonly user = this.authService.currentUser;
  readonly fullUserData = signal<User | null>(null);
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
    if (currentUser && currentUser.id) {
      // Cargar datos completos del usuario incluyendo createdAt, updatedAt, etc.
      this.usersService.getById(currentUser.id).subscribe({
        next: (response) => {
          if (!response.errors && response.data) {
            this.fullUserData.set(response.data);
            this.dataForm.patchValue({
              name: response.data.name,
              email: response.data.email || '',
            });
          }
        },
        error: (error) => {
          console.error('Error al cargar datos completos del usuario:', error);
          // Fallback: usar datos básicos del currentUser
          this.fullUserData.set(currentUser);
          this.dataForm.patchValue({
            name: currentUser.name,
            email: currentUser.email || '',
          });
        }
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
          // Actualizar ambos signals con los nuevos datos
          this.authService.currentUser.set(response.data);
          this.fullUserData.set(response.data);
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
    // Separar errores de campo vs errores generales
    const formFields = ['name', 'email', 'password', 'passwordConfirmation'];
    const fieldErrs: Record<string, string> = {};
    const generalErrs: string[] = [];

    Object.entries(errors).forEach(([field, message]) => {
      if (formFields.includes(field)) {
        fieldErrs[field] = message;
      } else {
        generalErrs.push(message);
      }
    });

    this.fieldErrors.set(fieldErrs);
    if (generalErrs.length > 0) {
      this.generalError.set(generalErrs.join('. '));
    }
  }

  private handleHttpError(errorResponse: any): void {
    // Formato 1: {errors: true, errorsList: {...}} en el body del error
    if (errorResponse.error?.errors === true && errorResponse.error?.errorsList) {
      this.handleErrors(errorResponse.error.errorsList);
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
