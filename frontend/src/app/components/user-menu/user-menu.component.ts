import { Component, ChangeDetectionStrategy, signal, inject, input, computed } from '@angular/core';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs/operators';
import { AuthStore } from '../../core/auth/auth.store';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-user-menu',
  imports: [RouterLink],
  templateUrl: './user-menu.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserMenuComponent {
  readonly variant = input<'desktop' | 'mobile'>('desktop');

  readonly isOpen = signal(false);

  private readonly authStore = inject(AuthStore);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // Exponer señales del store para el template
  readonly user = this.authStore.user;
  readonly isAuthenticated = this.authStore.isAuthenticated;

  // Computed signal para el nombre a mostrar
  readonly displayName = computed(() => {
    const u = this.user() as any;
    return u?.user?.username || u?.user?.name || u?.username || u?.name || 'Usuario';
  });

  constructor() {
    // Cerrar dropdown al navegar
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed()
      )
      .subscribe(() => this.close());
  }

  toggle(): void {
    this.isOpen.update((current: boolean) => !current);
  }

  close(): void {
    this.isOpen.set(false);
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.authStore.clear();
        this.close();
        this.router.navigateByUrl('/');
      },
      error: (err: unknown) => {
        console.error('Error al cerrar sesión:', err);
        // Incluso si falla el backend, limpiamos el estado local
        this.authStore.clear();
        this.close();
        this.router.navigateByUrl('/');
      }
    });
  }
}
