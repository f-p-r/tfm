import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HelpHoverDirective } from './help-hover.directive';
import { HelpOverlayService } from './help-overlay.service';
import { HelpContentService } from './help-content.service';
import { By } from '@angular/platform-browser';

@Component({
  template: `<input helpHover [helpTitle]="title" [helpText]="text" [helpKey]="key" />`,
  imports: [HelpHoverDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class HostComponent {
  title?: string;
  text?: string;
  key?: string;
}

function setup(props: { title?: string; text?: string; key?: string } = {}, supportsHover = true) {
  const mockOverlay = { open: vi.fn(), close: vi.fn() };
  const mockContent = { getItem: vi.fn().mockReturnValue(null) };

  // Mock de matchMedia para simular capacidad de hover
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: supportsHover,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  TestBed.configureTestingModule({
    imports: [HostComponent],
    providers: [
      { provide: HelpOverlayService, useValue: mockOverlay },
      { provide: HelpContentService, useValue: mockContent },
    ],
  });

  const fixture = TestBed.createComponent(HostComponent);
  fixture.componentInstance.title = props.title;
  fixture.componentInstance.text = props.text;
  fixture.componentInstance.key = props.key;
  fixture.detectChanges();

  const directiveEl = fixture.debugElement.query(By.directive(HelpHoverDirective));
  const nativeEl = directiveEl.nativeElement as HTMLElement;
  const directive = directiveEl.injector.get(HelpHoverDirective);

  return { fixture, directive, nativeEl, mockOverlay, mockContent };
}

describe('HelpHoverDirective', () => {
  it('should create', () => {
    const { directive } = setup({ title: 'T', text: 'X' });
    expect(directive).toBeTruthy();
  });

  describe('mouseenter with direct title/text', () => {
    it('opens overlay on mouseenter', () => {
      const { directive, nativeEl, mockOverlay } = setup({ title: 'My Title', text: 'My Text' });
      directive.onMouseEnter();
      expect(mockOverlay.open).toHaveBeenCalledWith(nativeEl, 'My Title', 'My Text', false);
    });

    it('does NOT open overlay when title is missing', () => {
      const { directive, mockOverlay } = setup({ text: 'Only text' });
      directive.onMouseEnter();
      expect(mockOverlay.open).not.toHaveBeenCalled();
    });

    it('does NOT open overlay when text is missing', () => {
      const { directive, mockOverlay } = setup({ title: 'Only title' });
      directive.onMouseEnter();
      expect(mockOverlay.open).not.toHaveBeenCalled();
    });
  });

  describe('mouseenter on non-hover device', () => {
    it('does NOT open overlay when device has no hover', () => {
      const { directive, mockOverlay } = setup({ title: 'T', text: 'X' }, false);
      directive.onMouseEnter();
      expect(mockOverlay.open).not.toHaveBeenCalled();
    });
  });

  describe('mouseleave', () => {
    it('closes overlay on mouseleave', () => {
      const { directive, mockOverlay } = setup({ title: 'T', text: 'X' });
      directive.onMouseEnter();
      directive.onMouseLeave();
      expect(mockOverlay.close).toHaveBeenCalled();
    });

    it('does NOT close overlay on mouseleave when device has no hover', () => {
      const { directive, mockOverlay } = setup({ title: 'T', text: 'X' }, false);
      directive.onMouseLeave();
      expect(mockOverlay.close).not.toHaveBeenCalled();
    });
  });

  describe('focusin', () => {
    it('closes overlay on focusin', () => {
      const { directive, mockOverlay } = setup({ title: 'T', text: 'X' });
      directive.onFocusIn();
      expect(mockOverlay.close).toHaveBeenCalled();
    });

    it('prevents re-opening popover on mouseenter after focusin', () => {
      const { directive, mockOverlay } = setup({ title: 'T', text: 'X' });
      directive.onFocusIn(); // establece isFocused = true
      mockOverlay.open.mockClear();
      directive.onMouseEnter(); // debe bloquearse
      expect(mockOverlay.open).not.toHaveBeenCalled();
    });
  });

  describe('focusout', () => {
    it('allows hover to open popover again after focusout', () => {
      const { directive, nativeEl, mockOverlay } = setup({ title: 'T', text: 'X' });
      directive.onFocusIn();
      directive.onFocusOut(); // establece isFocused = false
      mockOverlay.open.mockClear();
      directive.onMouseEnter();
      expect(mockOverlay.open).toHaveBeenCalledWith(nativeEl, 'T', 'X', false);
    });
  });

  describe('helpKey input', () => {
    it('resolves title and text from content service via helpKey', () => {
      const { directive, nativeEl, mockContent, mockOverlay } = setup({ key: 'email' });
      mockContent.getItem.mockReturnValue({ title: 'Email', text: 'Tu email' });
      directive.onMouseEnter();
      expect(mockOverlay.open).toHaveBeenCalledWith(nativeEl, 'Email', 'Tu email', false);
    });

    it('does not open popover when helpKey resolves to nothing', () => {
      const { directive, mockContent, mockOverlay } = setup({ key: 'missing' });
      mockContent.getItem.mockReturnValue(null);
      directive.onMouseEnter();
      expect(mockOverlay.open).not.toHaveBeenCalled();
    });
  });
});
