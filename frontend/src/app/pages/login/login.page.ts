import { Component, ChangeDetectionStrategy, inject, signal, PLATFORM_ID, OnInit } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../../core/auth/auth.service';
import { isLaravelValidationError } from '../../core/auth/laravel-validation-error';
import { environment } from '../../../environments/environment';
import { User } from '../../core/auth/user.model';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.page.html',
  styleUrl: './login.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly platformId = inject(PLATFORM_ID);

  readonly form = this.fb.nonNullable.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  readonly generalError = signal<string | null>(null);
  readonly fieldErrors = signal<Record<string, string>>({});
  readonly isSubmitting = signal(false);
  readonly successMessage = signal<string | null>(null);

  ngOnInit(): void {
    // Detectar si viene de registro exitoso
    const newUser = this.route.snapshot.queryParamMap.get('newUser');
    if (newUser) {
      this.successMessage.set(`¡Cuenta creada exitosamente para ${newUser}! Ya puedes iniciar sesión.`);
      // Limpiar el queryParam de la URL
      this.router.navigate([], {
        queryParams: { newUser: null },
        queryParamsHandling: 'merge',
        replaceUrl: true
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid || this.isSubmitting()) {
      return;
    }

    this.generalError.set(null);
    this.fieldErrors.set({});
    this.successMessage.set(null);
    this.isSubmitting.set(true);

    const { username, password } = this.form.getRawValue();

    this.authService.login(username, password).subscribe({
      next: (user: User) => {
        // Redirigir a returnUrl si existe, sino al home
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/';
        this.router.navigate([returnUrl]);
      },
      error: (errorResponse: any) => {
        this.isSubmitting.set(false);

        // Formato 1: Respuesta exitosa pero con errores de validación (errors: true, errorsList: {...})
        if (errorResponse.errors === true && errorResponse.errorsList) {
          const backendErrors: Record<string, string> = {};
          Object.entries(errorResponse.errorsList).forEach(([field, message]) => {
            backendErrors[field] = message as string;
          });
          this.fieldErrors.set(backendErrors);

          // Si hay un error sin campo específico (ej: 'id', 'general'), mostrarlo como error general
          if (errorResponse.errorsList['id'] || errorResponse.errorsList['general']) {
            this.generalError.set(errorResponse.errorsList['id'] || errorResponse.errorsList['general']);
          }
        }
        // Formato 2: Error HTTP estándar
        else if (errorResponse.status === 401) {
          this.generalError.set('Credenciales inválidas');
        }
        // Formato 3: Error Laravel (422 con errors)
        else if (errorResponse.status === 422 && isLaravelValidationError(errorResponse)) {
          const backendErrors: Record<string, string> = {};
          Object.entries(errorResponse.errors || {}).forEach(([field, messages]) => {
            backendErrors[field] = (messages as string[])[0];
          });
          this.fieldErrors.set(backendErrors);
          if (errorResponse.message) {
            this.generalError.set(errorResponse.message);
          }
        }
        // Fallback: mensaje genérico
        else {
          this.generalError.set('Ha ocurrido un error. Por favor, inténtalo de nuevo.');
        }
      },
    });
  }

  loginWithGoogle(): void {
    if (isPlatformBrowser(this.platformId)) {
      window.location.href = `${environment.apiBaseUrl}/api/auth/google/redirect`;
    }
  }

  loginWithFacebook(): void {
    if (isPlatformBrowser(this.platformId)) {
      window.location.href = `${environment.apiBaseUrl}/api/auth/facebook/redirect`;
    }
  }

  cancel(): void {
    this.location.back();
  }

  getFieldError(field: string): string | null {
    return this.fieldErrors()[field] || null;
  }
}
