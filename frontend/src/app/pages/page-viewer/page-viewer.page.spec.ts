import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { of, throwError, Subject } from 'rxjs';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { PageViewerPage } from './page-viewer.page';
import { PagesService } from '../../core/pages/pages.service';
import { GamesApiService } from '../../core/games/games-api.service';
import { AssociationsApiService } from '../../core/associations/associations-api.service';
import { SiteParamsService } from '../../core/site-params/site-params.service';
import { PageOwnerScope, PageDTO, PageNavItemDTO } from '../../shared/content/page.dto';

// ---------------------------------------------------------------
// Datos de prueba
// ---------------------------------------------------------------

const STUB_PAGE: PageDTO = {
  id: 1,
  slug: 'home',
  title: 'Home',
  content: {} as any,
  home: true,
} as unknown as PageDTO;

const STUB_NAV_ITEMS: PageNavItemDTO[] = [
  { id: 1, slug: 'home', title: 'Home', home: true } as PageNavItemDTO,
  { id: 2, slug: 'about', title: 'About', home: false } as PageNavItemDTO,
  { id: 3, slug: 'contact', title: 'Contact', home: false } as PageNavItemDTO,
];

// ---------------------------------------------------------------
// Función de configuración
// ---------------------------------------------------------------

interface SetupOptions {
  params?: Record<string, string>;
  urlPaths?: string[];
  pages?: {
    listPublicByOwner?: any;
    getPublicById?: any;
    getPublicPageByOwnerSlug?: any;
    getPublicHomePage?: any;
  };
  siteParams?: { getNumber?: any };
}

describe('PageViewerPage', () => {
  let fixture: ComponentFixture<PageViewerPage>;
  let component: PageViewerPage;
  let pagesServiceMock: any;
  let siteParamsMock: any;
  let routerEventsBus: Subject<any>;
  let navigateSpy: ReturnType<typeof vi.fn>;

  async function setup(opts: SetupOptions = {}) {
    TestBed.resetTestingModule();

    pagesServiceMock = {
      listPublicByOwner: opts.pages?.listPublicByOwner ?? vi.fn().mockReturnValue(of([])),
      getPublicById: opts.pages?.getPublicById ?? vi.fn().mockReturnValue(of(null)),
      getPublicPageByOwnerSlug: opts.pages?.getPublicPageByOwnerSlug ?? vi.fn().mockReturnValue(of(null)),
      getPublicHomePage: opts.pages?.getPublicHomePage ?? vi.fn().mockReturnValue(of(null)),
    };

    siteParamsMock = {
      getNumber: opts.siteParams?.getNumber ?? vi.fn().mockReturnValue(of(null)),
    };

    routerEventsBus = new Subject();
    navigateSpy = vi.fn();

    const routerMock = {
      events: routerEventsBus.asObservable(),
      navigate: navigateSpy,
    };

    await TestBed.configureTestingModule({
      imports: [PageViewerPage],
      providers: [
        { provide: PagesService, useValue: pagesServiceMock },
        { provide: GamesApiService, useValue: {} },
        { provide: AssociationsApiService, useValue: {} },
        { provide: SiteParamsService, useValue: siteParamsMock },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              params: opts.params ?? {},
              url: (opts.urlPaths ?? []).map((path) => ({ path })),
            },
          },
        },
        { provide: Router, useValue: routerMock },
      ],
    })
      .overrideComponent(PageViewerPage, {
        set: {
          imports: [],
          template: `<div></div>`,
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(PageViewerPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  // ---------------------------------------------------------------
  // Creación
  // ---------------------------------------------------------------

  it('should create', async () => {
    await setup();
    expect(component).toBeTruthy();
  });

  // ---------------------------------------------------------------
  // Página de inicio global (URL vacía)
  // ---------------------------------------------------------------

  describe('Global homepage (empty URL)', () => {
    it('should call siteParamsService.getNumber("homepage")', async () => {
      await setup({ urlPaths: [] });
      expect(siteParamsMock.getNumber).toHaveBeenCalledWith('homepage');
    });

    it('should show error when homepage param is null', async () => {
      await setup({ urlPaths: [] });
      expect(component.error()).toContain('No hay página de inicio configurada');
    });

    it('should load page by id when homepage param returns an id', async () => {
      const pageOfId5 = { ...STUB_PAGE, id: 5 };
      await setup({
        urlPaths: [],
        pages: { getPublicById: vi.fn().mockReturnValue(of(pageOfId5)) },
        siteParams: { getNumber: vi.fn().mockReturnValue(of(5)) },
      });

      expect(pagesServiceMock.getPublicById).toHaveBeenCalledWith(5);
      expect(component.page()?.id).toBe(5);
      expect(component.loading()).toBe(false);
    });

    it('should show error when siteParamsService throws', async () => {
      await setup({
        urlPaths: [],
        siteParams: {
          getNumber: vi.fn().mockReturnValue(throwError(() => new Error('network'))),
        },
      });
      expect(component.error()).toContain('No hay página de inicio configurada');
    });
  });

  // ---------------------------------------------------------------
  // /paginas/:slug — página global por slug
  // ---------------------------------------------------------------

  describe('/paginas/:slug — global page', () => {
    it('should call getPublicPageByOwnerSlug with GLOBAL scope and slug', async () => {
      await setup({
        params: { slug: 'info' },
        urlPaths: ['paginas'],
        pages: { getPublicPageByOwnerSlug: vi.fn().mockReturnValue(of(STUB_PAGE)) },
      });

      expect(pagesServiceMock.getPublicPageByOwnerSlug).toHaveBeenCalledWith(
        PageOwnerScope.GLOBAL,
        'global',
        'info'
      );
      expect(component.page()).toEqual(STUB_PAGE);
    });

    it('should show error when page is not found (null response)', async () => {
      await setup({
        params: { slug: 'missing' },
        urlPaths: ['paginas'],
        pages: { getPublicPageByOwnerSlug: vi.fn().mockReturnValue(of(null)) },
      });
      expect(component.error()).toBe('Página no encontrada');
    });

    it('should show error when no slug provided', async () => {
      await setup({ urlPaths: ['paginas'] }); // sin params.slug
      expect(component.error()).toBe('Slug de página no especificado');
    });

    it('should show error when service throws', async () => {
      await setup({
        params: { slug: 'broken' },
        urlPaths: ['paginas'],
        pages: {
          getPublicPageByOwnerSlug: vi.fn().mockReturnValue(
            throwError(() => new Error('500'))
          ),
        },
      });
      expect(component.error()).toBe('Error al cargar la página');
      expect(component.loading()).toBe(false);
    });
  });

  // ---------------------------------------------------------------
  // /juegos/:slug — página de inicio del juego
  // ---------------------------------------------------------------

  describe('/juegos/:slug — game homepage', () => {
    it('should call getPublicHomePage with GAME scope and slug', async () => {
      await setup({
        params: { slug: 'chess' },
        urlPaths: ['juegos'],
        pages: { getPublicHomePage: vi.fn().mockReturnValue(of(STUB_PAGE)) },
      });

      expect(pagesServiceMock.getPublicHomePage).toHaveBeenCalledWith(
        PageOwnerScope.GAME,
        'chess'
      );
      expect(component.page()).toEqual(STUB_PAGE);
    });

    it('should show error when no game slug provided', async () => {
      await setup({ urlPaths: ['juegos'] });
      expect(component.error()).toBe('Slug de juego no especificado');
    });

    it('should show error when game homepage not found', async () => {
      await setup({
        params: { slug: 'chess' },
        urlPaths: ['juegos'],
        pages: { getPublicHomePage: vi.fn().mockReturnValue(of(null)) },
      });
      expect(component.error()).toBe('Página de inicio del juego no encontrada');
    });
  });

  // ---------------------------------------------------------------
  // /juegos/:slug/:pagina — página de juego por slug
  // ---------------------------------------------------------------

  describe('/juegos/:slug/:pagina — specific game page', () => {
    it('should call getPublicPageByOwnerSlug with GAME scope, gameSlug, and pageSlug', async () => {
      await setup({
        params: { slug: 'chess', pagina: 'rules' },
        urlPaths: ['juegos'],
        pages: { getPublicPageByOwnerSlug: vi.fn().mockReturnValue(of(STUB_PAGE)) },
      });

      expect(pagesServiceMock.getPublicPageByOwnerSlug).toHaveBeenCalledWith(
        PageOwnerScope.GAME,
        'chess',
        'rules'
      );
    });
  });

  // ---------------------------------------------------------------
  // /asociaciones/:slug — página de inicio de la asociación
  // ---------------------------------------------------------------

  describe('/asociaciones/:slug — association homepage', () => {
    it('should call getPublicHomePage with ASSOCIATION scope and slug', async () => {
      await setup({
        params: { slug: 'my-assoc' },
        urlPaths: ['asociaciones'],
        pages: { getPublicHomePage: vi.fn().mockReturnValue(of(STUB_PAGE)) },
      });

      expect(pagesServiceMock.getPublicHomePage).toHaveBeenCalledWith(
        PageOwnerScope.ASSOCIATION,
        'my-assoc'
      );
    });

    it('should show error when no association slug provided', async () => {
      await setup({ urlPaths: ['asociaciones'] });
      expect(component.error()).toBe('Slug de asociación no especificado');
    });
  });

  // ---------------------------------------------------------------
  // /asociaciones/:slug/:pagina — página específica de asociación
  // ---------------------------------------------------------------

  describe('/asociaciones/:slug/:pagina', () => {
    it('should call getPublicPageByOwnerSlug with ASSOCIATION scope', async () => {
      await setup({
        params: { slug: 'my-assoc', pagina: 'about' },
        urlPaths: ['asociaciones'],
        pages: { getPublicPageByOwnerSlug: vi.fn().mockReturnValue(of(STUB_PAGE)) },
      });

      expect(pagesServiceMock.getPublicPageByOwnerSlug).toHaveBeenCalledWith(
        PageOwnerScope.ASSOCIATION,
        'my-assoc',
        'about'
      );
    });
  });

  // ---------------------------------------------------------------
  // Ruta desconocida
  // ---------------------------------------------------------------

  it('should show error for unrecognised URL segment', async () => {
    await setup({ urlPaths: ['unknown-route'] });
    expect(component.error()).toBe('Ruta no reconocida');
  });

  // ---------------------------------------------------------------
  // Carga de navPages
  // ---------------------------------------------------------------

  it('should sort navPages: home pages first', async () => {
    const unsorted: PageNavItemDTO[] = [
      { id: 2, slug: 'about', title: 'About', home: false } as PageNavItemDTO,
      { id: 1, slug: 'home', title: 'Home', home: true } as PageNavItemDTO,
    ];
    await setup({
      params: { slug: 'info' },
      urlPaths: ['paginas'],
      pages: {
        listPublicByOwner: vi.fn().mockReturnValue(of(unsorted)),
        getPublicPageByOwnerSlug: vi.fn().mockReturnValue(of(STUB_PAGE)),
      },
    });

    const nav = component.navPages();
    expect(nav[0].home).toBe(true);
    expect(nav[1].home).toBe(false);
  });

  it('should set navPages=[] when listPublicByOwner throws', async () => {
    await setup({
      params: { slug: 'info' },
      urlPaths: ['paginas'],
      pages: {
        listPublicByOwner: vi.fn().mockReturnValue(throwError(() => new Error('503'))),
        getPublicPageByOwnerSlug: vi.fn().mockReturnValue(of(null)),
      },
    });
    expect(component.navPages()).toEqual([]);
  });

  it('should not reload navPages when navigating within the same owner', async () => {
    await setup({
      params: { slug: 'chess' },
      urlPaths: ['juegos'],
      pages: {
        listPublicByOwner: vi.fn().mockReturnValue(of(STUB_NAV_ITEMS)),
        getPublicHomePage: vi.fn().mockReturnValue(of(STUB_PAGE)),
      },
    });

    const firstCallCount: number = pagesServiceMock.listPublicByOwner.mock.calls.length;

    // Simular navegación dentro del mismo owner (snapshot.url sigue apuntando a 'juegos', mismos params)
    (component as any).route.snapshot.url = [{ path: 'juegos' }];
    routerEventsBus.next(new NavigationEnd(1, '/juegos/chess', '/juegos/chess'));

    // listPublicByOwner NO debe volver a llamarse — hit de caché
    expect(pagesServiceMock.listPublicByOwner.mock.calls.length).toBe(firstCallCount);
  });

  // ---------------------------------------------------------------
  // onPageSelect()
  // ---------------------------------------------------------------

  describe('onPageSelect()', () => {
    function makeSelectEvent(value: string): Event {
      return { target: { value } } as unknown as Event;
    }

    it('should navigate to game subpage URL for non-home page', async () => {
      await setup({ params: { slug: 'chess' }, urlPaths: ['juegos'] });
      component.navPages.set(STUB_NAV_ITEMS);
      (component as any).navOwnerType = PageOwnerScope.GAME;
      (component as any).navOwnerSlug = 'chess';

      component.onPageSelect(makeSelectEvent('about'));

      expect(navigateSpy).toHaveBeenCalledWith(['/juegos', 'chess', 'about']);
    });

    it('should navigate to game root for home page', async () => {
      await setup({ params: { slug: 'chess' }, urlPaths: ['juegos'] });
      component.navPages.set(STUB_NAV_ITEMS);
      (component as any).navOwnerType = PageOwnerScope.GAME;
      (component as any).navOwnerSlug = 'chess';

      component.onPageSelect(makeSelectEvent('home'));

      expect(navigateSpy).toHaveBeenCalledWith(['/juegos', 'chess']);
    });

    it('should navigate to association subpage URL', async () => {
      await setup({ params: { slug: 'my-org' }, urlPaths: ['asociaciones'] });
      component.navPages.set(STUB_NAV_ITEMS);
      (component as any).navOwnerType = PageOwnerScope.ASSOCIATION;
      (component as any).navOwnerSlug = 'my-org';

      component.onPageSelect(makeSelectEvent('about'));

      expect(navigateSpy).toHaveBeenCalledWith(['/asociaciones', 'my-org', 'about']);
    });

    it('should navigate to association root for home page', async () => {
      await setup({ params: { slug: 'my-org' }, urlPaths: ['asociaciones'] });
      component.navPages.set(STUB_NAV_ITEMS);
      (component as any).navOwnerType = PageOwnerScope.ASSOCIATION;
      (component as any).navOwnerSlug = 'my-org';

      component.onPageSelect(makeSelectEvent('home'));

      expect(navigateSpy).toHaveBeenCalledWith(['/asociaciones', 'my-org']);
    });

    it('should navigate to /paginas/slug for global non-home page', async () => {
      await setup({ urlPaths: [] });
      component.navPages.set(STUB_NAV_ITEMS);
      (component as any).navOwnerType = PageOwnerScope.GLOBAL;
      (component as any).navOwnerSlug = 'global';

      component.onPageSelect(makeSelectEvent('about'));

      expect(navigateSpy).toHaveBeenCalledWith(['/paginas', 'about']);
    });

    it('should navigate to "/" for global home page', async () => {
      await setup({ urlPaths: [] });
      component.navPages.set(STUB_NAV_ITEMS);
      (component as any).navOwnerType = PageOwnerScope.GLOBAL;
      (component as any).navOwnerSlug = 'global';

      component.onPageSelect(makeSelectEvent('home'));

      expect(navigateSpy).toHaveBeenCalledWith(['/']);
    });

    it('should not navigate when selected slug is not in navPages', async () => {
      await setup({ params: { slug: 'chess' }, urlPaths: ['juegos'] });
      component.navPages.set(STUB_NAV_ITEMS);
      (component as any).navOwnerType = PageOwnerScope.GAME;
      (component as any).navOwnerSlug = 'chess';

      component.onPageSelect(makeSelectEvent('nonexistent'));

      expect(navigateSpy).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------
  // NavigationEnd dispara la recarga de página
  // ---------------------------------------------------------------

  it('should reload page on NavigationEnd event', async () => {
    await setup({
      params: { slug: 'info' },
      urlPaths: ['paginas'],
      pages: { getPublicPageByOwnerSlug: vi.fn().mockReturnValue(of(STUB_PAGE)) },
    });

    const prevCallCount: number = pagesServiceMock.getPublicPageByOwnerSlug.mock.calls.length;

    routerEventsBus.next(new NavigationEnd(2, '/paginas/info', '/paginas/info'));

    expect(pagesServiceMock.getPublicPageByOwnerSlug.mock.calls.length).toBeGreaterThan(
      prevCallCount
    );
  });

  // ---------------------------------------------------------------
  // ngOnDestroy
  // ---------------------------------------------------------------

  it('should unsubscribe from router events on destroy', async () => {
    await setup({ urlPaths: [] });
    const subscription = (component as any).routerSubscription;
    const unsubscribeSpy = vi.spyOn(subscription, 'unsubscribe');

    component.ngOnDestroy();

    expect(unsubscribeSpy).toHaveBeenCalledOnce();
  });
});
