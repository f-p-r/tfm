import { Component, ChangeDetectionStrategy, signal, inject, input, computed, ElementRef } from '@angular/core';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, fromEvent } from 'rxjs';
// Eliminamos AuthStore, ya no es la fuente de verdad
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

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly elementRef = inject(ElementRef);

  // 1. CORRECCIÓN: Conectamos directamente con las señales del servicio
  // (que es quien tiene los datos frescos tras el F5)
  readonly user = this.authService.currentUser;
  readonly isAuthenticated = this.authService.isAuthenticated;

  // Computed signal para el nombre a mostrar
  readonly displayName = computed(() => {
    const u = this.user();
    if (!u) return 'Usuario';
    // Como en el servicio ya mapeamos la respuesta, 'u' es el objeto usuario directo
    return u.username || u.name || 'Usuario';
  });

  constructor() {
    // Cerrar dropdown al navegar
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed()
      )
      .subscribe(() => this.close());

    // Cerrar dropdown al hacer clic fuera del componente
    fromEvent<MouseEvent>(document, 'click')
      .pipe(takeUntilDestroyed())
      .subscribe((event) => {
        // Solo cerramos si el clic fue fuera del componente
        if (this.isOpen() && !this.elementRef.nativeElement.contains(event.target)) {
          this.close();
        }
      });
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
        this.close();
        this.router.navigateByUrl('/');
      },
      error: (err: unknown) => {
        console.error('Error al cerrar sesión:', err);
        this.close();
        this.router.navigateByUrl('/');
      }
    });
  }
}
