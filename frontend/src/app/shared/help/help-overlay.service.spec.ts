import { TestBed } from '@angular/core/testing';
import { HelpOverlayService } from './help-overlay.service';

function makeAnchor(): HTMLElement {
  const el = document.createElement('button');
  el.style.width = '80px';
  el.style.height = '30px';
  // jsdom devuelve todos ceros en getBoundingClientRect por defecto; mockear un rect razonable
  vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
    top: 100, bottom: 130, left: 50, right: 130,
    width: 80, height: 30, x: 50, y: 100,
    toJSON: () => ({}),
  });
  document.body.appendChild(el);
  return el;
}

describe('HelpOverlayService', () => {
  let service: HelpOverlayService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HelpOverlayService);
    vi.useFakeTimers();
  });

  afterEach(() => {
    service.close();
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  describe('open()', () => {
    it('appends a popover to document.body', () => {
      const anchor = makeAnchor();
      service.open(anchor, 'Title', 'Body text');
      expect(document.querySelector('.ds-popover')).not.toBeNull();
    });

    it('sets popover title using textContent', () => {
      const anchor = makeAnchor();
      service.open(anchor, 'My Title', 'My text');
      const titleEl = document.querySelector('.ds-popover-title');
      expect(titleEl?.textContent).toBe('My Title');
    });

    it('sets popover text using textContent', () => {
      const anchor = makeAnchor();
      service.open(anchor, 'Title', 'Body content');
      const textEl = document.querySelector('.ds-popover-text');
      expect(textEl?.textContent).toBe('Body content');
    });

    it('renders close button by default', () => {
      const anchor = makeAnchor();
      service.open(anchor, 'T', 'X');
      expect(document.querySelector('.ds-popover-actions button')).not.toBeNull();
    });

    it('does NOT render close button when withCloseButton=false', () => {
      const anchor = makeAnchor();
      service.open(anchor, 'T', 'X', false);
      expect(document.querySelector('.ds-popover-actions')).toBeNull();
    });

    it('closes previous popover before opening new one', () => {
      const anchor = makeAnchor();
      service.open(anchor, 'First', 'One');
      service.open(anchor, 'Second', 'Two');
      expect(document.querySelectorAll('.ds-popover')).toHaveLength(1);
      expect(document.querySelector('.ds-popover-title')?.textContent).toBe('Second');
    });

    it('registers document click listener after delay', () => {
      const anchor = makeAnchor();
      const spy = vi.spyOn(document, 'addEventListener');
      service.open(anchor, 'T', 'X');
      // Antes del tick: el listener aún no está registrado
      expect(spy).not.toHaveBeenCalledWith('click', expect.any(Function), true);
      vi.runAllTimers();
      expect(spy).toHaveBeenCalledWith('click', expect.any(Function), true);
    });

    it('close button click removes the popover', () => {
      const anchor = makeAnchor();
      service.open(anchor, 'T', 'X');
      const closeBtn = document.querySelector<HTMLButtonElement>('.ds-popover-actions button')!;
      closeBtn.click();
      expect(document.querySelector('.ds-popover')).toBeNull();
    });
  });

  describe('close()', () => {
    it('removes popover element from DOM', () => {
      const anchor = makeAnchor();
      service.open(anchor, 'T', 'X');
      service.close();
      expect(document.querySelector('.ds-popover')).toBeNull();
    });

    it('is safe to call when no popover is open', () => {
      expect(() => service.close()).not.toThrow();
    });

    it('removes keydown listener on close', () => {
      const anchor = makeAnchor();
      service.open(anchor, 'T', 'X');
      vi.runAllTimers();
      const spy = vi.spyOn(document, 'removeEventListener');
      service.close();
      expect(spy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });
  });

  describe('Escape key closes popover', () => {
    it('closes popover when Escape is dispatched', () => {
      const anchor = makeAnchor();
      service.open(anchor, 'T', 'X');
      vi.runAllTimers(); // registrar el listener de keydown

      const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
      document.dispatchEvent(event);

      expect(document.querySelector('.ds-popover')).toBeNull();
    });
  });

  describe('click outside closes popover', () => {
    it('closes popover on click outside anchor and popover', () => {
      const anchor = makeAnchor();
      service.open(anchor, 'T', 'X');
      vi.runAllTimers(); // registrar el listener de click

      const outside = document.createElement('div');
      document.body.appendChild(outside);
      outside.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      expect(document.querySelector('.ds-popover')).toBeNull();
    });
  });
});
