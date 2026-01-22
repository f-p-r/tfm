import { ChangeDetectionStrategy, Component, input, signal, inject, computed } from '@angular/core';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { GamesStore } from '../../core/games/games.store';
import { UserMenuComponent } from '../user-menu/user-menu.component';

@Component({
  selector: 'app-navbar',
  imports: [RouterModule, UserMenuComponent],
  templateUrl: './navbar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarComponent {
  readonly mode = input<'portal' | 'game' | 'association'>('portal');
  readonly contextName = input<string | undefined>(undefined);
  readonly showAdmin = input<boolean>(false);

  readonly mobileMenuOpen = signal(false);
  readonly gamesQuery = signal('');

  private readonly router = inject(Router);
  readonly gamesStore = inject(GamesStore);

  readonly filteredGames = computed(() => {
    const q = this.gamesQuery().toLowerCase().trim();
    const list = this.gamesStore.sortedGames();
    if (!q) return list;
    return list.filter((g: string) => g.toLowerCase().includes(q));
  });

  constructor() {
    this.gamesStore.loadOnce();
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.closeMobileMenu());
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((current: boolean) => !current);
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

  onDesktopGameChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value?.trim();
    if (!value || value.toLowerCase() === 'todos los juegos') {
      this.gamesStore.setSelected(null);
      this.router.navigateByUrl('/');
      return;
    }
    this.gamesStore.setSelected(value);
    const slug = this.gamesStore.slugify(value);
    this.router.navigateByUrl(`/games/${slug}`);
  }

  selectGameMobile(name: string | null): void {
    if (!name) {
      this.gamesStore.setSelected(null);
      this.router.navigateByUrl('/');
    } else {
      this.gamesStore.setSelected(name);
      const slug = this.gamesStore.slugify(name);
      this.router.navigateByUrl(`/games/${slug}`);
    }
    this.closeMobileMenu();
  }
}
