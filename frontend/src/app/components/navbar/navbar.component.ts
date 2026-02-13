import { ChangeDetectionStrategy, Component, input, signal, inject, computed, effect } from '@angular/core';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { NgTemplateOutlet } from '@angular/common';

// Stores y Servicios
import { GamesStore } from '../../core/games/games.store';
import { Game } from '../../core/games/games.models';
import { ContextStore } from '../../core/context/context.store';
import { AssociationsResolveService } from '../../core/associations/associations-resolve.service';
import { ContextService } from '../../core/context/context.service';
import { WebScope } from '../../core/web-scope.constants';

// Componentes
import { UserMenuComponent } from '../user-menu/user-menu.component';
import { HelpPanelComponent } from '../../shared/help/help-panel/help-panel.component';

type NavItem = {
  label: string;
  type: 'link' | 'button';
  route?: any;
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
  // ... Inputs ...
  readonly mode = input<'portal' | 'game' | 'association'>('portal');
  readonly contextName = input<string | undefined>(undefined);
  readonly isAdmin = input<boolean>(false);

  // ... Estados ...
  readonly mobileMenuOpen = signal(false);
  readonly adminMenuOpen = signal(false); // <--- Control del dropdown admin
  readonly gamesQuery = signal('');
  readonly helpOpen = signal(false);

  // ... Inyecciones ...
  private readonly router = inject(Router);
  readonly gamesStore = inject(GamesStore);
  readonly contextStore = inject(ContextStore);
  private readonly associationsResolve = inject(AssociationsResolveService);
  private readonly contextService = inject(ContextService);

  readonly WebScope = WebScope;

  // ... Signals computadas ...

  /** Acciones administrativas dinámicas (Array) */
  readonly adminActions = toSignal(this.contextService.adminActions$);

  readonly filteredGames = computed(() => {
    const q = this.gamesQuery().toLowerCase().trim();
    const list = this.gamesStore.sortedGames();
    if (!q) return list;
    return list.filter((g: Game) => g.name.toLowerCase().includes(q));
  });

  /**
   * Elementos de navegación ESTÁNDAR.
   * NOTA: Ya no incluimos aquí las adminActions, se gestionan aparte en el HTML
   */
  readonly navItems = computed<NavItem[]>(() => {
    // 1. MODO ADMINISTRACIÓN (Panel interno)
    if (this.isAdmin()) {
      return [
        { label: 'Panel', type: 'button', onClick: () => this.toggleAdminSidebar() },
        { label: 'Salir de Admin', type: 'button', onClick: () => this.exitAdmin() },
        { label: '?', type: 'button', onClick: () => this.openHelp() },
      ];
    }

    // 2. MODO PÚBLICO
    const items: NavItem[] = [
      { label: 'Asociaciones', type: 'link', route: '/asociaciones' },
      { label: 'Eventos', type: 'link', route: '/events' },
      { label: 'Noticias', type: 'link', route: '/news' },
    ];

    // Botón de ayuda siempre al final
    items.push({ label: '?', type: 'button', onClick: () => this.openHelp() });

    return items;
  });

  constructor() {
    this.gamesStore.loadOnce().pipe(takeUntilDestroyed()).subscribe();

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        // Cerrar todos los menús al navegar
        this.closeMobileMenu();
        this.closeAdminMenu();

        // Cerrar sidebar en mobile al navegar
        if (window.innerWidth < 768) {
          const sidebar = document.getElementById('admin-sidebar');
          if (sidebar) {
            sidebar.classList.add('ds-admin-sidebar-closed');
          }
        }
      });

    effect(() => {
      if (this.isAdmin()) {
        setTimeout(() => {
          const sidebar = document.getElementById('admin-sidebar');
          if (sidebar) {
            sidebar.classList.remove('ds-admin-sidebar-closed');
          }
        }, 0);
      }
    });
  }

  // ... Métodos Públicos ...

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((current) => !current);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  toggleAdminMenu(): void {
    this.adminMenuOpen.update(v => !v);
  }

  closeAdminMenu(): void {
    this.adminMenuOpen.set(false);
  }

  get displayName(): string {
     if (this.isAdmin()) {
      const scopeType = this.contextStore.scopeType();
      const scopeId = this.contextStore.scopeId();

      if (!scopeType) return 'Administración';

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

    if (this.mode() === 'portal') {
      return 'Portal';
    }
    return this.contextName() || 'Portal';
  }

  onDesktopGameChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const value = select.value?.trim();
    this.navigateToGame(value);
  }

  onMobileGameChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const value = select.value?.trim();
    this.navigateToGame(value);
    this.closeMobileMenu();
  }

  private navigateToGame(value: string | undefined): void {
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

  openHelp(): void {
    this.helpOpen.set(true);
    this.closeMobileMenu();
  }

  closeHelp(): void {
    this.helpOpen.set(false);
  }

  noop(): void {}

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
