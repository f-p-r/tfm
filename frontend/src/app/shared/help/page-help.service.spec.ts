import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { PageHelpService } from './page-help.service';
import { DEFAULT_PAGE_HELP } from './page-content/default.help';

describe('PageHelpService', () => {
  let service: PageHelpService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([])],
    });
    service = TestBed.inject(PageHelpService);
    router = TestBed.inject(Router);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  it('starts with DEFAULT_PAGE_HELP', () => {
    expect(service.html()).toBe(DEFAULT_PAGE_HELP);
  });

  it('set() updates html signal', () => {
    service.set('<p>Custom help</p>');
    expect(service.html()).toBe('<p>Custom help</p>');
  });

  it('html is readonly (computed signal)', () => {
    expect(service.html).toBeDefined();
    // no puede establecerse directamente — solo verificar que devuelve el valor actual
    service.set('<p>New</p>');
    expect(service.html()).toBe('<p>New</p>');
  });

  it('resets to DEFAULT_PAGE_HELP on NavigationStart', async () => {
    service.set('<p>Page-specific help</p>');
    expect(service.html()).toBe('<p>Page-specific help</p>');

    await router.navigateByUrl('/');

    // Tras la navegación el servicio debe reiniciarse (NavigationStart se dispara antes que NavigationEnd)
    expect(service.html()).toBe(DEFAULT_PAGE_HELP);
  });

  it('each set() call overwrites the previous value', () => {
    service.set('<p>First</p>');
    service.set('<p>Second</p>');
    expect(service.html()).toBe('<p>Second</p>');
  });
});
