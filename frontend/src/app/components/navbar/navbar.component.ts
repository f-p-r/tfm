import { ChangeDetectionStrategy, Component, input, signal, inject } from '@angular/core';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';

@Component({
  selector: 'app-navbar',
  imports: [RouterModule],
  templateUrl: './navbar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarComponent {
  readonly mode = input<'portal' | 'game' | 'association'>('portal');
  readonly contextName = input<string | undefined>(undefined);
  readonly showAdmin = input<boolean>(false);

  readonly mobileMenuOpen = signal(false);

  private readonly router = inject(Router);

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.closeMobileMenu());
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((current) => !current);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  get displayName(): string {
    if (this.mode() === 'portal') {
      return 'Portal';
    }
    return this.contextName() || 'Portal';
  }
}
