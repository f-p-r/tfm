import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HelpPanelComponent } from './help-panel.component';
import { HelpPrefsService } from '../help-prefs.service';
import { PageHelpService } from '../page-help.service';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

function setup(isOpen = false) {
  const mockHelpPrefs = {
    helpIconsOn$: of(false),
    setHelpIconsOn: vi.fn(),
  };

  TestBed.configureTestingModule({
    imports: [HelpPanelComponent],
    providers: [
      provideRouter([]),
      { provide: HelpPrefsService, useValue: mockHelpPrefs },
    ],
  });

  const fixture = TestBed.createComponent(HelpPanelComponent);
  fixture.componentRef.setInput('isOpen', isOpen);
  fixture.detectChanges();
  return { fixture, component: fixture.componentInstance, mockHelpPrefs };
}

describe('HelpPanelComponent', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('should create', () => {
    const { component } = setup();
    expect(component).toBeTruthy();
  });

  describe('when isOpen=false', () => {
    it('renders nothing', () => {
      const { fixture } = setup(false);
      expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
    });
  });

  describe('when isOpen=true', () => {
    it('renders the dialog', () => {
      const { fixture } = setup(true);
      expect(fixture.nativeElement.querySelector('[role="dialog"]')).not.toBeNull();
    });

    it('has aria-modal=true', () => {
      const { fixture } = setup(true);
      const dialog = fixture.nativeElement.querySelector('[role="dialog"]');
      expect(dialog.getAttribute('aria-modal')).toBe('true');
    });

    it('has heading "Ayuda"', () => {
      const { fixture } = setup(true);
      expect(fixture.nativeElement.querySelector('h2')?.textContent?.trim()).toBe('Ayuda');
    });

    it('has a Cerrar button', () => {
      const { fixture } = setup(true);
      const btns = fixture.nativeElement.querySelectorAll('button');
      const closeBtn = Array.from(btns).find((b: any) => b.textContent?.trim() === 'Cerrar');
      expect(closeBtn).toBeDefined();
    });

    it('has a checkbox for help-icons-toggle', () => {
      const { fixture } = setup(true);
      expect(fixture.nativeElement.querySelector('#help-icons-toggle')).not.toBeNull();
    });
  });

  describe('onClose()', () => {
    it('emits close event when onClose() called', () => {
      const { component } = setup(true);
      const spy = vi.spyOn(component.close, 'emit');
      component.onClose();
      expect(spy).toHaveBeenCalledOnce();
    });

    it('emits close when Cerrar button is clicked', () => {
      const { fixture, component } = setup(true);
      const spy = vi.spyOn(component.close, 'emit');
      const btns: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('button'));
      const closeBtn = btns.find((b: HTMLButtonElement) => b.textContent?.trim() === 'Cerrar')!;
      closeBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      fixture.detectChanges();
      expect(spy).toHaveBeenCalledOnce();
    });
  });

  describe('onBackdropClick()', () => {
    it('calls onClose via backdrop click', () => {
      const { fixture, component } = setup(true);
      const spy = vi.spyOn(component, 'onClose');
      component.onBackdropClick();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('Escape key', () => {
    it('calls onClose when Escape is pressed and panel is open', () => {
      const { component } = setup(true);
      const spy = vi.spyOn(component, 'onClose');
      component.onEscape();
      expect(spy).toHaveBeenCalled();
    });

    it('does NOT call onClose when Escape is pressed and panel is closed', () => {
      const { component } = setup(false);
      const spy = vi.spyOn(component, 'onClose');
      component.onEscape();
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('onToggleChange()', () => {
    it('calls helpPrefs.setHelpIconsOn with checked value', () => {
      const { component, mockHelpPrefs } = setup(true);
      const event = { target: { checked: true } } as unknown as Event;
      component.onToggleChange(event);
      expect(mockHelpPrefs.setHelpIconsOn).toHaveBeenCalledWith(true);
    });

    it('calls helpPrefs.setHelpIconsOn(false) when unchecked', () => {
      const { component, mockHelpPrefs } = setup(true);
      const event = { target: { checked: false } } as unknown as Event;
      component.onToggleChange(event);
      expect(mockHelpPrefs.setHelpIconsOn).toHaveBeenCalledWith(false);
    });
  });
});
