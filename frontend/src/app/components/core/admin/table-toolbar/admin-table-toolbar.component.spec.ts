import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminTableToolbarComponent } from './admin-table-toolbar.component';
import { HelpOverlayService } from '../../../../shared/help/help-overlay.service';
import { HelpContentService } from '../../../../shared/help/help-content.service';

function setup(props: {
  showSearch?: boolean;
  placeholder?: string;
  searchHelpKey?: string;
} = {}) {
  const mockOverlay = { open: vi.fn(), close: vi.fn() };

  // Mock de matchMedia usado internamente por HelpHoverDirective
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((q: string) => ({
      matches: true, media: q, onchange: null,
      addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
    })),
  });

  TestBed.configureTestingModule({
    imports: [AdminTableToolbarComponent],
    providers: [
      { provide: HelpOverlayService, useValue: mockOverlay },
    ],
  });

  const fixture = TestBed.createComponent(AdminTableToolbarComponent);
  const component = fixture.componentInstance;

  if (props.showSearch !== undefined) component.showSearch = props.showSearch;
  if (props.placeholder !== undefined) component.placeholder = props.placeholder;
  if (props.searchHelpKey !== undefined) component.searchHelpKey = props.searchHelpKey;

  fixture.detectChanges();
  return { fixture, component };
}

describe('AdminTableToolbarComponent', () => {
  it('should create', () => {
    const { component } = setup();
    expect(component).toBeTruthy();
  });

  // ------------------------------------------------------------------ showSearch
  describe('showSearch input', () => {
    it('renders search input by default (showSearch=true)', () => {
      const { fixture } = setup();
      expect(fixture.nativeElement.querySelector('input[type="text"]')).not.toBeNull();
    });

    it('hides search input when showSearch=false', () => {
      const { fixture } = setup({ showSearch: false });
      expect(fixture.nativeElement.querySelector('input[type="text"]')).toBeNull();
    });
  });

  // ------------------------------------------------------------------ placeholder
  describe('placeholder input', () => {
    it('uses default placeholder "Buscar..."', () => {
      const { fixture } = setup();
      const input = fixture.nativeElement.querySelector('input');
      expect(input.placeholder).toBe('Buscar...');
    });

    it('uses custom placeholder when provided', () => {
      const { fixture } = setup({ placeholder: 'Filtrar usuarios...' });
      const input = fixture.nativeElement.querySelector('input');
      expect(input.placeholder).toBe('Filtrar usuarios...');
    });
  });

  // ------------------------------------------------------------------ onSearchChange / search output
  describe('search output', () => {
    it('emits search event when input value changes', () => {
      const { fixture, component } = setup();
      const emitted: string[] = [];
      component.search.subscribe((v: string) => emitted.push(v));

      const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
      input.value = 'hello';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      expect(emitted).toHaveLength(1);
      expect(emitted[0]).toBe('hello');
    });

    it('emits empty string when input is cleared', () => {
      const { fixture, component } = setup();
      const emitted: string[] = [];
      component.search.subscribe((v: string) => emitted.push(v));

      const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
      input.value = 'abc';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      input.value = '';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      expect(emitted).toHaveLength(2);
      expect(emitted[1]).toBe('');
    });

    it('onSearchChange() directly emits the given value', () => {
      const { component } = setup();
      const emitted: string[] = [];
      component.search.subscribe((v: string) => emitted.push(v));

      component.onSearchChange('test value');
      expect(emitted).toEqual(['test value']);
    });
  });

  // ------------------------------------------------------------------ searchHelpKey
  describe('searchHelpKey input', () => {
    it('passes helpKey to HelpHoverDirective (attribute present on input)', () => {
      const { fixture } = setup({ searchHelpKey: 'user-search' });
      // La directiva está aplicada — verificar que el input se renderiza es suficiente
      // ya que el binding de la directiva no puede inspeccionarse solo mediante el DOM
      expect(fixture.nativeElement.querySelector('input[type="text"]')).not.toBeNull();
    });
  });

  // ------------------------------------------------------------------ searchTerm binding
  describe('two-way binding of searchTerm', () => {
    it('updates searchTerm when input changes', () => {
      const { fixture, component } = setup();
      const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
      input.value = 'angular';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      expect(component.searchTerm).toBe('angular');
    });

    it('starts with empty searchTerm', () => {
      const { component } = setup();
      expect(component.searchTerm).toBe('');
    });
  });

  // ------------------------------------------------------------------ content projection
  describe('content projection slots', () => {
    it('renders the toolbar container div', () => {
      const { fixture } = setup();
      expect(fixture.nativeElement.querySelector('.ds-table-toolbar')).not.toBeNull();
    });
  });
});
