import { Component, ChangeDetectionStrategy, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { AuthStore } from '../../core/auth/auth.store';

@Component({
  selector: 'app-auth-callback-page',
  imports: [],
  templateUrl: './auth-callback.page.html',
  styleUrl: './auth-callback.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthCallbackPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly authStore = inject(AuthStore);

  readonly status = signal<'processing' | 'success' | 'error'>('processing');
  readonly message = signal<string>('Procesando autenticación...');

  ngOnInit(): void {
    const ok = this.route.snapshot.queryParamMap.get('ok');
    const provider = this.route.snapshot.queryParamMap.get('provider');

    if (ok !== '1') {
      this.status.set('error');
      this.message.set('Error en la autenticación con ' + (provider || 'proveedor externo'));
      setTimeout(() => this.router.navigate(['/login']), 2000);
      return;
    }

    this.authService.me().subscribe({
      next: (user) => {
        this.authStore.setUser(user);
        this.status.set('success');
        this.message.set('Autenticación exitosa. Redirigiendo...');
        setTimeout(() => this.router.navigate(['/']), 1000);
      },
      error: () => {
        this.status.set('error');
        this.message.set('No se pudo verificar la sesión');
        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
    });
  }
}
