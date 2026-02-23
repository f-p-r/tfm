import { ChangeDetectionStrategy, Component, input, signal, inject, computed, effect, ElementRef } from '@angular/core';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { filter, fromEvent } from 'rxjs';
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
  readonly associationMenuOpen = signal(false); // <--- Control del dropdown asociación
  readonly gamesQuery = signal('');
  readonly helpOpen = signal(false);
  readonly scrolledDown = signal(false);
  private lastScrollY = 0;

  // ... Inyecciones ...
  private readonly router = inject(Router);
  private readonly elementRef = inject(ElementRef);
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

  /** Shortname de la asociación actual (cuando scope es ASSOCIATION) */
  readonly associationShortname = computed(() => {
    if (this.contextStore.scopeType() === WebScope.ASSOCIATION) {
      const scopeId = this.contextStore.scopeId();
      if (scopeId) {
        const association = this.associationsResolve.getById(scopeId);
        return association?.shortname || association?.name || '';
      }
    }
    return '';
  });

  /** Slug de la asociación actual (cuando scope es ASSOCIATION) */
  readonly associationSlug = computed(() => {
    if (this.contextStore.scopeType() === WebScope.ASSOCIATION) {
      const scopeId = this.contextStore.scopeId();
      if (scopeId) {
        const association = this.associationsResolve.getById(scopeId);
        return association?.slug || '';
      }
    }
    return '';
  });

  /** Indica si el scope actual es una asociación */
  readonly isAssociationScope = computed(() =>
    this.contextStore.scopeType() === WebScope.ASSOCIATION
  );

  /**
   * Ruta a la que vuelve el botón "Volver a Asociaciones".
   * Siempre navega a /asociaciones; el resolveScopeGuard se encarga de
   * restaurar el scope correcto (GAME o GLOBAL) según el contexto anterior.
   */
  readonly backToAssociationsRoute = computed(() => ['/asociaciones']);

  /** Ruta home contextual: / en global, /juegos/:slug en game, /asociaciones/:slug en association */
  readonly homeRoute = computed(() => {
    const type = this.contextStore.scopeType();
    const id = this.contextStore.scopeId();
    if (type === WebScope.GAME && id) {
      const game = this.gamesStore.getById(id);
      if (game?.slug) return ['/juegos', game.slug];
    }
    if (type === WebScope.ASSOCIATION && id) {
      const assoc = this.associationsResolve.getById(id);
      if (assoc?.slug) return ['/asociaciones', assoc.slug];
    }
    return ['/'];
  });

  /**
   * Elementos de navegación ESTÁNDAR.
   * NOTA: Ya no incluimos aquí las adminActions, se gestionan aparte en el HTML
   */
  readonly navItems = computed<NavItem[]>(() => {
    // 1. MODO ADMINISTRACIÓN
    if (this.isAdmin()) {
      return [
        { label: 'Salir Admin.', type: 'button', onClick: () => this.exitAdmin() },
        { label: '?', type: 'button', onClick: () => this.openHelp() },
      ];
    }

    // 2. MODO PÚBLICO
    const items: NavItem[] = [];

    // Solo mostrar 'Asociaciones' si NO estamos en scope de asociación
    if (this.contextStore.scopeType() !== WebScope.ASSOCIATION) {
      items.push({ label: 'Asociaciones', type: 'link', route: '/asociaciones' });
    }

    items.push(
      { label: 'Eventos', type: 'link', route: '/eventos' },
      { label: 'Noticias', type: 'link', route: '/noticias' }
    );

    // Solo mostrar 'Contacto' si NO estamos en scope de asociación
    if (this.contextStore.scopeType() !== WebScope.ASSOCIATION) {
      items.push({ label: 'Contacto', type: 'link', route: '/contacto' });
    }

    return items;
  });

  constructor() {
    this.gamesStore.loadOnce().pipe(takeUntilDestroyed()).subscribe();

    // Ocultar navbar al hacer scroll hacia abajo en mobile, mostrar al subir
    fromEvent(window, 'scroll', { passive: true })
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        const currentY = window.scrollY;
        if (currentY < 10) {
          this.scrolledDown.set(false);
        } else if (currentY > this.lastScrollY + 5) {
          this.scrolledDown.set(true);
        } else if (currentY < this.lastScrollY - 5) {
          this.scrolledDown.set(false);
        }
        this.lastScrollY = currentY;
      });

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        // Cerrar todos los menús al navegar
        this.closeMobileMenu();
        this.closeAdminMenu();
        this.closeAssociationMenu();
        // Restaurar navbar al navegar
        this.scrolledDown.set(false);
        this.lastScrollY = 0;

        // Cerrar sidebar en mobile al navegar
        if (window.innerWidth < 768) {
          const sidebar = document.getElementById('admin-sidebar');
          if (sidebar) {
            sidebar.classList.add('ds-admin-sidebar-closed');
          }
        }
      });

    // Cerrar dropdowns al hacer clic fuera del navbar
    fromEvent<MouseEvent>(document, 'click')
      .pipe(takeUntilDestroyed())
      .subscribe((event) => {
        // Solo cerramos si el clic fue fuera del componente navbar
        if (!this.elementRef.nativeElement.contains(event.target)) {
          if (this.adminMenuOpen()) {
            this.closeAdminMenu();
          }
          if (this.associationMenuOpen()) {
            this.closeAssociationMenu();
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

  toggleAssociationMenu(): void {
    this.associationMenuOpen.update(v => !v);
  }

  closeAssociationMenu(): void {
    this.associationMenuOpen.set(false);
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

  exitAdmin(): void {
    this.router.navigateByUrl('/');
    this.closeMobileMenu();
  }
}
