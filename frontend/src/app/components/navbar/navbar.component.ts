import { ChangeDetectionStrategy, Component, input, signal, inject, computed, effect } from '@angular/core';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { GamesStore } from '../../core/games/games.store';
import { Game } from '../../core/games/games.models';
import { UserMenuComponent } from '../user-menu/user-menu.component';
import { HelpPanelComponent } from '../../shared/help/help-panel/help-panel.component';
import { AuthzService } from '../../core/authz/authz.service';
import { isSummaryResponse } from '../../core/authz/authz.models';
import { WebScope } from '../../core/web-scope.constants';
import { ContextStore } from '../../core/context/context.store';
import { NgTemplateOutlet } from '@angular/common';

type NavItem = {
  label: string;
  type: 'link' | 'button';
  route?: string;
  onClick?: () => void;
  condition?: () => boolean;
};

@Component({
  selector: 'app-navbar',
  imports: [RouterModule, UserMenuComponent, HelpPanelComponent, NgTemplateOutlet],
  templateUrl: './navbar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarComponent {
  readonly mode = input<'portal' | 'game' | 'association'>('portal');
  readonly contextName = input<string | undefined>(undefined);

  readonly mobileMenuOpen = signal(false);
  readonly gamesQuery = signal('');
  readonly helpOpen = signal(false);
  readonly canSeeAdmin = signal(false);

  private readonly router = inject(Router);
  private readonly authz = inject(AuthzService);
  readonly gamesStore = inject(GamesStore);
  readonly contextStore = inject(ContextStore);
  readonly WebScope = WebScope;

  readonly filteredGames = computed(() => {
    const q = this.gamesQuery().toLowerCase().trim();
    const list = this.gamesStore.sortedGames();
    if (!q) return list;
    return list.filter((g: Game) => g.name.toLowerCase().includes(q));
  });

  readonly navItems = computed<NavItem[]>(() => [
    { label: 'Asociaciones', type: 'link', route: '/asociaciones' },
    { label: 'Eventos', type: 'link', route: '/events' },
    { label: 'Noticias', type: 'link', route: '/news' },
    { label: 'Admin', type: 'link', route: '/admin', condition: () => this.canSeeAdmin() },
    { label: '?', type: 'button', onClick: () => this.openHelp() },
  ]);

  constructor() {
    this.gamesStore.loadOnce().pipe(takeUntilDestroyed()).subscribe();

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        this.closeMobileMenu();
      });

    // Evaluar permisos de admin cuando mode es 'portal' (scope GLOBAL)
    effect(() => {
      const currentMode = this.mode();
      if (currentMode === 'portal') {
        this.checkAdminPermission();
      } else {
        this.canSeeAdmin.set(false);
      }
    });
  }

  private checkAdminPermission(): void {
    this.authz
      .query({
        scopeType: WebScope.GLOBAL,
        scopeIds: [],
        permissions: ['web.admin'],
        breakdown: false,
      })
      .subscribe({
        next: (res) => {
          console.log('[NavbarComponent] Respuesta authz query:', res);
          // Discriminar tipo de respuesta
          if (isSummaryResponse(res)) {
            // Si all=true o hay scopeIds, tiene el permiso
            const hasPermission = res.all || res.scopeIds.length > 0;
            console.log('[NavbarComponent] Summary response - hasPermission:', hasPermission, 'all:', res.all, 'scopeIds:', res.scopeIds);
            this.canSeeAdmin.set(hasPermission);
          } else {
            // breakdown=true (no debería ocurrir con breakdown:false, pero por seguridad)
            const hasPermission = res.all || res.allPermissions.includes('web.admin');
            console.log('[NavbarComponent] Breakdown response - hasPermission:', hasPermission, 'all:', res.all, 'allPermissions:', res.allPermissions);
            this.canSeeAdmin.set(hasPermission);
          }
        },
        error: (err) => {
          // En caso de error (ej: 401), no mostrar Admin
          console.log('[NavbarComponent] Error en authz query:', err);
          this.canSeeAdmin.set(false);
        },
      });
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
    const select = event.target as HTMLSelectElement;
    const value = select.value?.trim();
    if (!value) {
      this.gamesStore.setSelected(null);
      this.router.navigateByUrl('/');
      return;
    }
    const gameId = parseInt(value, 10);
    this.gamesStore.setSelected(gameId);
    const game = this.gamesStore.getById(gameId);
    if (game) {
      this.router.navigateByUrl(`/juegos/${game.slug}`);
    }
  }

  selectGameMobile(value: string | null): void {
    if (!value) {
      this.gamesStore.setSelected(null);
      this.router.navigateByUrl('/');
    } else {
      const gameId = parseInt(value, 10);
      this.gamesStore.setSelected(gameId);
      const game = this.gamesStore.getById(gameId);
      if (game) {
        this.router.navigateByUrl(`/juegos/${game.slug}`);
      }
    }
    this.closeMobileMenu();
  }

  openHelp(): void {
    this.helpOpen.set(true);
    this.closeMobileMenu();
  }

  closeHelp(): void {
    this.helpOpen.set(false);
  }

  noop(): void {
    // No operation - usado en desktop nav items que no necesitan callback
  }

  onMobileGameChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const value = select.value?.trim();
    this.selectGameMobile(value === '' ? null : value);
  }
}
