import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HelpIComponent } from './help-i.component';
import { HelpPrefsService } from '../help-prefs.service';
import { HelpOverlayService } from '../help-overlay.service';
import { HelpContentService } from '../help-content.service';
import { HelpPack } from '../help.types';
import { BehaviorSubject } from 'rxjs';

function setup(
  props: { helpKey?: string; title?: string; text?: string } = {},
  helpIconsOn = true,
  packOverride?: HelpPack,
) {
  const helpIconsOn$ = new BehaviorSubject<boolean>(helpIconsOn);
  const mockHelpPrefs = { helpIconsOn$ };
  const mockOverlay = { open: vi.fn(), close: vi.fn() };

  TestBed.configureTestingModule({
    imports: [HelpIComponent],
    providers: [
      { provide: HelpPrefsService, useValue: mockHelpPrefs },
      { provide: HelpOverlayService, useValue: mockOverlay },
      // Usar HelpContentService real para que computed() rastree signals correctamente
    ],
  });

  // Configurar el pack ANTES de crear el componente para que computed() obtenga el valor correcto
  const contentService = TestBed.inject(HelpContentService);
  if (packOverride) contentService.setPack(packOverride);

  const fixture = TestBed.createComponent(HelpIComponent);
  if (props.helpKey !== undefined) fixture.componentRef.setInput('helpKey', props.helpKey);
  if (props.title !== undefined) fixture.componentRef.setInput('title', props.title);
  if (props.text !== undefined) fixture.componentRef.setInput('text', props.text);
  fixture.detectChanges();

  return { fixture, component: fixture.componentInstance, mockOverlay, contentService, helpIconsOn$ };
}

describe('HelpIComponent', () => {
  it('should create', () => {
    const { component } = setup();
    expect(component).toBeTruthy();
  });

  describe('visibility', () => {
    it('renders button when title, text and helpIconsOn are set', () => {
      const { fixture } = setup({ title: 'T', text: 'X' }, true);
      expect(fixture.nativeElement.querySelector('button.ds-help-i')).not.toBeNull();
    });

    it('does NOT render button when helpIconsOn is false', () => {
      const { fixture } = setup({ title: 'T', text: 'X' }, false);
      expect(fixture.nativeElement.querySelector('button.ds-help-i')).toBeNull();
    });

    it('does NOT render button when no title/text provided', () => {
      const { fixture } = setup({}, true);
      expect(fixture.nativeElement.querySelector('button.ds-help-i')).toBeNull();
    });
  });

  describe('resolvedTitle / resolvedText (direct inputs)', () => {
    it('resolves title from direct input', () => {
      const { component } = setup({ title: 'My Title', text: 'My text' });
      expect(component.resolvedTitle()).toBe('My Title');
    });

    it('resolves text from direct input', () => {
      const { component } = setup({ title: 'My Title', text: 'My text' });
      expect(component.resolvedText()).toBe('My text');
    });
  });

  describe('resolvedTitle / resolvedText (helpKey)', () => {
    const emailPack: HelpPack = {
      items: { email: { title: 'Email', text: 'Tu email' } },
    };

    it('resolves title from content service when helpKey is set', () => {
      const { component } = setup({ helpKey: 'email' }, true, emailPack);
      expect(component.resolvedTitle()).toBe('Email');
    });

    it('resolves text from content service when helpKey is set', () => {
      const { component } = setup({ helpKey: 'email' }, true, emailPack);
      expect(component.resolvedText()).toBe('Tu email');
    });

    it('returns null when helpKey not found in content service', () => {
      const { component } = setup({ helpKey: 'missing' });
      expect(component.resolvedTitle()).toBeNull();
    });
  });

  describe('onClick()', () => {
    it('calls overlay.open with anchor, title, text', () => {
      const { component, mockOverlay } = setup({ title: 'T', text: 'Body' });
      // Simular que buttonRef se establece
      const btn = document.createElement('button');
      (component as any).buttonRef = { nativeElement: btn };
      component.onClick();
      expect(mockOverlay.open).toHaveBeenCalledWith(btn, 'T', 'Body', true);
    });

    it('does nothing if buttonRef is undefined', () => {
      const { component, mockOverlay } = setup({ title: 'T', text: 'Body' });
      (component as any).buttonRef = undefined;
      expect(() => component.onClick()).not.toThrow();
      expect(mockOverlay.open).not.toHaveBeenCalled();
    });

    it('does nothing if resolved title is null', () => {
      const { component, mockOverlay } = setup({});
      const btn = document.createElement('button');
      (component as any).buttonRef = { nativeElement: btn };
      component.onClick();
      expect(mockOverlay.open).not.toHaveBeenCalled();
    });
  });

  describe('aria-label', () => {
    it('sets aria-label with resolved title', () => {
      const { fixture } = setup({ title: 'Email', text: 'Tu email' }, true);
      const btn = fixture.nativeElement.querySelector('button.ds-help-i');
      expect(btn?.getAttribute('aria-label')).toBe('Ayuda: Email');
    });
  });
});
