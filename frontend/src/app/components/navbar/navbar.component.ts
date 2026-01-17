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
  readonly brandLabel = input<string>('App');
  readonly brandPath = input<string>('/');
  readonly links = input<Array<{ label: string; path: string }>>([]);

  readonly isOpen = signal(false);

  private readonly router = inject(Router);

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.close());
  }

  toggle(): void {
    this.isOpen.update((current) => !current);
  }

  close(): void {
    this.isOpen.set(false);
  }
}
