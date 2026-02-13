import { Component, ChangeDetectionStrategy, inject, signal, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../../core/auth/auth.service';
import { isLaravelValidationError } from '../../core/auth/laravel-validation-error';
import { environment } from '../../../environments/environment';
import { User } from '../../core/auth/user.model';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule],
  templateUrl: './login.page.html',
  styleUrl: './login.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  readonly form = this.fb.nonNullable.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  readonly generalError = signal<string | null>(null);
  readonly fieldErrors = signal<Record<string, string[]>>({});
  readonly isSubmitting = signal(false);

  onSubmit(): void {
    if (this.form.invalid || this.isSubmitting()) {
      return;
    }

    this.generalError.set(null);
    this.fieldErrors.set({});
    this.isSubmitting.set(true);

    const { username, password } = this.form.getRawValue();

    this.authService.login(username, password).subscribe({
      next: (user: User) => {
        // El AuthService ya actualiza currentUser signal automáticamente
        this.router.navigate(['/']);
      },
      error: (error: { status: number; message?: string; errors?: Record<string, string[]> }) => {
        this.isSubmitting.set(false);

        if (error.status === 401) {
          this.generalError.set('Credenciales inválidas');
        } else if (error.status === 422 && isLaravelValidationError(error)) {
          this.fieldErrors.set(error.errors || {});
          if (error.message) {
            this.generalError.set(error.message);
          }
        } else {
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

  getFieldError(field: string): string | null {
    const errors = this.fieldErrors()[field];
    return errors && errors.length > 0 ? errors[0] : null;
  }
}
