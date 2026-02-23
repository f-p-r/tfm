import { TestBed } from '@angular/core/testing';
import { HelpPrefsService } from './help-prefs.service';

describe('HelpPrefsService', () => {
  let service: HelpPrefsService;

  beforeEach(() => {
    localStorage.clear();
    document.body.classList.remove('help-icons-on');
    TestBed.configureTestingModule({});
    service = TestBed.inject(HelpPrefsService);
  });

  afterEach(() => {
    localStorage.clear();
    document.body.classList.remove('help-icons-on');
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  describe('initial state', () => {
    it('defaults to false when no stored value', () => {
      expect(service.helpIconsOn$.value).toBe(false);
    });

    it('restores true from localStorage "1"', () => {
      localStorage.setItem('helpIconsOn', '1');
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const s2 = TestBed.inject(HelpPrefsService);
      expect(s2.helpIconsOn$.value).toBe(true);
    });

    it('restores false from localStorage "0"', () => {
      localStorage.setItem('helpIconsOn', '0');
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const s2 = TestBed.inject(HelpPrefsService);
      expect(s2.helpIconsOn$.value).toBe(false);
    });

    it('adds help-icons-on class to body when stored value is "1"', () => {
      localStorage.setItem('helpIconsOn', '1');
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      TestBed.inject(HelpPrefsService);
      expect(document.body.classList.contains('help-icons-on')).toBe(true);
    });
  });

  describe('setHelpIconsOn()', () => {
    it('sets value to true in BehaviorSubject', () => {
      service.setHelpIconsOn(true);
      expect(service.helpIconsOn$.value).toBe(true);
    });

    it('sets value to false in BehaviorSubject', () => {
      service.setHelpIconsOn(true);
      service.setHelpIconsOn(false);
      expect(service.helpIconsOn$.value).toBe(false);
    });

    it('persists "1" to localStorage when true', () => {
      service.setHelpIconsOn(true);
      expect(localStorage.getItem('helpIconsOn')).toBe('1');
    });

    it('persists "0" to localStorage when false', () => {
      service.setHelpIconsOn(false);
      expect(localStorage.getItem('helpIconsOn')).toBe('0');
    });

    it('adds help-icons-on class to body when true', () => {
      service.setHelpIconsOn(true);
      expect(document.body.classList.contains('help-icons-on')).toBe(true);
    });

    it('removes help-icons-on class from body when false', () => {
      document.body.classList.add('help-icons-on');
      service.setHelpIconsOn(false);
      expect(document.body.classList.contains('help-icons-on')).toBe(false);
    });
  });

  describe('toggleHelpIcons()', () => {
    it('flips false to true', () => {
      expect(service.helpIconsOn$.value).toBe(false);
      service.toggleHelpIcons();
      expect(service.helpIconsOn$.value).toBe(true);
    });

    it('flips true to false', () => {
      service.setHelpIconsOn(true);
      service.toggleHelpIcons();
      expect(service.helpIconsOn$.value).toBe(false);
    });
  });
});
