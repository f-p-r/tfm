import { Component, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs/operators';
import { NavbarComponent } from './components/navbar/navbar.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {
  private readonly router = inject(Router);
  protected readonly title = signal('frontend');

  // Signal que indica si la ruta actual NO debe tener navbar
  protected readonly noNavbar = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
      startWith(this.router.url),
      map((url) => {
        return url.startsWith('/login') ||
               url.startsWith('/auth/callback') ||
               url.endsWith('/pages/preview') ||
               url.startsWith('/styleguide') ||
               url.startsWith('/prototypes');
      })
    ),
    { initialValue: this.hasNoNavbar(this.router.url) }
  );

  // Signal que indica si la ruta necesita layout completamente libre (sin contenedores)
  protected readonly freeLayout = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
      startWith(this.router.url),
      map((url) => {
        return url.endsWith('/pages/preview') ||
               url.startsWith('/styleguide') ||
               url.startsWith('/prototypes');
      })
    ),
    { initialValue: this.hasFreeLayout(this.router.url) }
  );

  private hasNoNavbar(url: string): boolean {
    return url.startsWith('/login') ||
           url.startsWith('/auth/callback') ||
           url.endsWith('/pages/preview') ||
           url.startsWith('/styleguide') ||
           url.startsWith('/prototypes');
  }

  private hasFreeLayout(url: string): boolean {
    return url.endsWith('/pages/preview') ||
           url.startsWith('/styleguide') ||
           url.startsWith('/prototypes');
  }
}
