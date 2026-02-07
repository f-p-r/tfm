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
import { AssociationsResolveService } from '../../core/associations/associations-resolve.service';
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
  readonly isAdmin = input<boolean>(false);

  readonly mobileMenuOpen = signal(false);
  readonly gamesQuery = signal('');
  readonly helpOpen = signal(false);
  readonly canSeeAdmin = signal(false);

  private readonly router = inject(Router);
  private readonly authz = inject(AuthzService);
  readonly gamesStore = inject(GamesStore);
  readonly contextStore = inject(ContextStore);
  private readonly associationsResolve = inject(AssociationsResolveService);
  readonly WebScope = WebScope;

  readonly filteredGames = computed(() => {
    const q = this.gamesQuery().toLowerCase().trim();
    const list = this.gamesStore.sortedGames();
    if (!q) return list;
    return list.filter((g: Game) => g.name.toLowerCase().includes(q));
  });

  readonly navItems = computed<NavItem[]>(() => {
    if (this.isAdmin()) {
      // Modo admin: mostrar opciones específicas de administración
      return [
        { label: 'Panel', type: 'button', onClick: () => this.toggleAdminSidebar() },
        { label: 'Salir de Admin', type: 'button', onClick: () => this.exitAdmin() },
        { label: '?', type: 'button', onClick: () => this.openHelp() },
      ];
    }
    // Modo normal: opciones estándar
    return [
      { label: 'Asociaciones', type: 'link', route: '/asociaciones' },
      { label: 'Eventos', type: 'link', route: '/events' },
      { label: 'Noticias', type: 'link', route: '/news' },
      { label: 'Admin', type: 'link', route: '/admin', condition: () => this.canSeeAdmin() },
      { label: '?', type: 'button', onClick: () => this.openHelp() },
    ];
  });

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

    // Cuando está en modo Admin, asegurar que el sidebar esté visible por defecto
    effect(() => {
      if (this.isAdmin()) {
        // Usar setTimeout para asegurar que el DOM está listo
        setTimeout(() => {
          const sidebar = document.getElementById('admin-sidebar');
          if (sidebar) {
            sidebar.classList.remove('ds-admin-sidebar-closed');
          }
        }, 0);
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
    if (this.isAdmin()) {
      // Modo admin: mostrar contexto según scopeType
      const scopeType = this.contextStore.scopeType();
      const scopeId = this.contextStore.scopeId();

      // Si no hay scopeType definido, mostrar solo "Administración"
      if (!scopeType) {
        return 'Administración';
      }

      if (scopeType === WebScope.GLOBAL) {
        return 'Administración de la web';
      }

      if (scopeType === WebScope.GAME && scopeId) {
        const game = this.gamesStore.getById(scopeId);
        return game ? game.name : 'Administración';
      }

      if (scopeType === WebScope.ASSOCIATION && scopeId) {
        const association = this.associationsResolve.getById(scopeId);
        return association ? association.name : 'Administración';
      }

      return 'Administración';
    }

    // Modo normal
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

  toggleAdminSidebar(): void {
    const sidebar = document.getElementById('admin-sidebar');
    if (sidebar) {
      sidebar.classList.toggle('ds-admin-sidebar-closed');
    }
    this.closeMobileMenu();
  }

  exitAdmin(): void {
    this.router.navigateByUrl('/');
    this.closeMobileMenu();
  }
}
