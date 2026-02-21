import { Component, signal, inject, ChangeDetectionStrategy, DestroyRef, OnInit } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs/operators';
import { fromEvent } from 'rxjs';
import { NavbarComponent } from './components/navbar/navbar.component';
import { AuthService } from './core/auth/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App implements OnInit {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly title = signal('frontend');

  // Signal que indica si la ruta actual NO debe tener navbar
  protected readonly noNavbar = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
      startWith(this.router.url),
      map((url) => this.hasNoNavbar(url))
    ),
    { initialValue: this.hasNoNavbar(this.router.url) }
  );

  // Signal que indica si la ruta necesita layout completamente libre (sin contenedores)
  protected readonly freeLayout = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
      startWith(this.router.url),
      map((url) => this.hasFreeLayout(url))
    ),
    { initialValue: this.hasFreeLayout(this.router.url) }
  );

  // Signal que indica si la ruta actual es del área de administración
  protected readonly isAdminMode = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
      startWith(this.router.url),
      map((url) => url.startsWith('/admin'))
    ),
    { initialValue: this.router.url.startsWith('/admin') }
  );

  ngOnInit(): void {
    // Opción 2: re-verificar sesión cuando la pestaña vuelve a ser visible.
    // Cubre el caso en que la cookie caducó mientras la pestaña estaba en segundo plano.
    fromEvent(document, 'visibilitychange')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (document.visibilityState === 'visible' && this.authService.currentUser() !== null) {
          console.log('[App] Pestaña visible — re-verificando sesión');
          this.authService.checkSession().subscribe();
        }
      });
  }

  private hasNoNavbar(url: string): boolean {
    return url.startsWith('/login') ||
           url.startsWith('/auth/callback') ||
           url.endsWith('/pages/preview') ||
           url.startsWith('/styleguide') ||
           url.startsWith('/prototypes')
  }

  private hasFreeLayout(url: string): boolean {
    return url === '/admin/pages/preview' || !url.startsWith('/admin');
  }
}
