import { TestBed } from '@angular/core/testing';
import { HelpContentService } from './help-content.service';
import { HelpPack } from './help.types';

const packA: HelpPack = {
  items: {
    email: { title: 'Email', text: 'Introduce tu email' },
    name: { title: 'Nombre', text: 'Tu nombre completo' },
  },
};

const packB: HelpPack = {
  items: {
    email: { title: 'Email B', text: 'Override email' },
    extra: { title: 'Extra', text: 'Campo extra' },
  },
};

describe('HelpContentService', () => {
  let service: HelpContentService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HelpContentService);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  describe('getItem (empty pool)', () => {
    it('returns null when pool is empty', () => {
      expect(service.getItem('email')).toBeNull();
    });
  });

  describe('setPack()', () => {
    it('sets a single pack and getItem resolves keys', () => {
      service.setPack(packA);
      expect(service.getItem('email')).toEqual({ title: 'Email', text: 'Introduce tu email' });
      expect(service.getItem('name')).toEqual({ title: 'Nombre', text: 'Tu nombre completo' });
    });

    it('returns null for missing key', () => {
      service.setPack(packA);
      expect(service.getItem('nonexistent')).toBeNull();
    });

    it('replaces previous pack when called again', () => {
      service.setPack(packA);
      service.setPack(packB);
      expect(service.getItem('name')).toBeNull(); // clave de packA eliminada
      expect(service.getItem('extra')).toEqual({ title: 'Extra', text: 'Campo extra' });
    });

    it('clears pool when called with null', () => {
      service.setPack(packA);
      service.setPack(null);
      expect(service.getItem('email')).toBeNull();
    });
  });

  describe('mergePack()', () => {
    it('adds a second pack without removing the first', () => {
      service.setPack(packA);
      service.mergePack(packB);
      expect(service.getItem('name')).toEqual({ title: 'Nombre', text: 'Tu nombre completo' }); // de A
      expect(service.getItem('extra')).toEqual({ title: 'Extra', text: 'Campo extra' }); // de B
    });

    it('later pack overrides earlier pack for same key (last wins)', () => {
      service.setPack(packA);
      service.mergePack(packB);
      expect(service.getItem('email')).toEqual({ title: 'Email B', text: 'Override email' }); // B sobreescribe A
    });
  });

  describe('removePack()', () => {
    it('removes a merged pack by reference', () => {
      service.setPack(packA);
      service.mergePack(packB);
      service.removePack(packB);
      expect(service.getItem('email')).toEqual({ title: 'Email', text: 'Introduce tu email' }); // recurre a A
      expect(service.getItem('extra')).toBeNull(); // B fue eliminado
    });

    it('does nothing if pack was not registered', () => {
      service.setPack(packA);
      service.removePack(packB); // no registrado
      expect(service.getItem('email')).toEqual({ title: 'Email', text: 'Introduce tu email' });
    });
  });

  describe('getItem() with packOverride', () => {
    it('uses packOverride instead of pool', () => {
      service.setPack(packA);
      expect(service.getItem('email', packB)).toEqual({ title: 'Email B', text: 'Override email' });
    });

    it('returns null if key missing in packOverride even when pool has it', () => {
      service.setPack(packA);
      expect(service.getItem('name', packB)).toBeNull();
    });
  });

  describe('getBasePack()', () => {
    it('returns null when pool is empty', () => {
      expect(service.getBasePack()).toBeNull();
    });

    it('returns first pack (base pack) even after merge', () => {
      service.setPack(packA);
      service.mergePack(packB);
      expect(service.getBasePack()).toBe(packA);
    });
  });
});
