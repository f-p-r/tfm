import { ContextStore } from './context.store';
import { WebScope } from '../web-scope.constants';

/**
 * ContextStore no tiene dependencias inyectadas: solo signals y computed.
 * Se instancia directamente con `new` en cada test para garantizar aislamiento.
 */
describe('ContextStore', () => {
  let store: ContextStore;

  beforeEach(() => {
    store = new ContextStore();
  });

  // ---------------------------------------------------------------------------
  // Estado inicial
  // ---------------------------------------------------------------------------

  describe('estado inicial', () => {
    it('debe iniciar en scope GLOBAL', () => {
      expect(store.scopeType()).toBe(WebScope.GLOBAL);
    });

    it('debe iniciar con scopeId null', () => {
      expect(store.scopeId()).toBeNull();
    });

    it('debe iniciar con source "manual"', () => {
      expect(store.source()).toBe('manual');
    });

    it('debe iniciar sin scope previo', () => {
      expect(store.previousScopeType()).toBeNull();
      expect(store.previousScopeId()).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // Señales calculadas: isGlobal, hasScope, scopeKey
  // ---------------------------------------------------------------------------

  describe('computed: isGlobal', () => {
    it('es true en estado inicial (GLOBAL)', () => {
      expect(store.isGlobal()).toBe(true);
    });

    it('es false tras establecer ASSOCIATION', () => {
      store.setScope(WebScope.ASSOCIATION, 42);
      expect(store.isGlobal()).toBe(false);
    });

    it('es false tras establecer GAME', () => {
      store.setScope(WebScope.GAME, 7);
      expect(store.isGlobal()).toBe(false);
    });

    it('vuelve a true tras setGlobal()', () => {
      store.setScope(WebScope.ASSOCIATION, 42);
      store.setGlobal();
      expect(store.isGlobal()).toBe(true);
    });
  });

  describe('computed: hasScope', () => {
    it('es false en estado inicial', () => {
      expect(store.hasScope()).toBe(false);
    });

    it('es true con ASSOCIATION y scopeId válido', () => {
      store.setScope(WebScope.ASSOCIATION, 10);
      expect(store.hasScope()).toBe(true);
    });

    it('es true con GAME y scopeId válido', () => {
      store.setScope(WebScope.GAME, 5);
      expect(store.hasScope()).toBe(true);
    });

    it('es false con scope no-global pero scopeId null (estado unknown)', () => {
      store.setScope(WebScope.ASSOCIATION, null);
      expect(store.hasScope()).toBe(false);
    });

    it('es false tras volver a GLOBAL', () => {
      store.setScope(WebScope.GAME, 3);
      store.setGlobal();
      expect(store.hasScope()).toBe(false);
    });
  });

  describe('computed: scopeKey', () => {
    it('es "1:all" en estado inicial (GLOBAL)', () => {
      expect(store.scopeKey()).toBe('1:all');
    });

    it('incluye el ID de la asociación', () => {
      store.setScope(WebScope.ASSOCIATION, 42);
      expect(store.scopeKey()).toBe('2:42');
    });

    it('incluye el ID del juego', () => {
      store.setScope(WebScope.GAME, 7);
      expect(store.scopeKey()).toBe('3:7');
    });

    it('vuelve a "1:all" tras setGlobal()', () => {
      store.setScope(WebScope.GAME, 7);
      store.setGlobal();
      expect(store.scopeKey()).toBe('1:all');
    });
  });

  // ---------------------------------------------------------------------------
  // setGlobal()
  // ---------------------------------------------------------------------------

  describe('setGlobal()', () => {
    it('establece scopeType a GLOBAL y scopeId a null', () => {
      store.setScope(WebScope.ASSOCIATION, 5);
      store.setGlobal();
      expect(store.scopeType()).toBe(WebScope.GLOBAL);
      expect(store.scopeId()).toBeNull();
    });

    it('guarda el scope previo al cambiar', () => {
      store.setScope(WebScope.GAME, 99);
      store.setGlobal();
      expect(store.previousScopeType()).toBe(WebScope.GAME);
      expect(store.previousScopeId()).toBe(99);
    });

    it('no sobrescribe previousScope si ya era GLOBAL (no hay cambio de tipo)', () => {
      // Partimos de GLOBAL → setGlobal no debe tocar previousScope
      store.setGlobal();
      expect(store.previousScopeType()).toBeNull();
      expect(store.previousScopeId()).toBeNull();
    });

    it('acepta source personalizada', () => {
      store.setScope(WebScope.ASSOCIATION, 1);
      store.setGlobal('router');
      expect(store.source()).toBe('router');
    });

    it('usa source "manual" por defecto', () => {
      store.setScope(WebScope.ASSOCIATION, 1);
      store.setGlobal();
      expect(store.source()).toBe('manual');
    });

    it('actualiza updatedAt', () => {
      const before = store.updatedAt();
      store.setScope(WebScope.ASSOCIATION, 1);
      store.setGlobal();
      expect(store.updatedAt()).toBeGreaterThanOrEqual(before);
    });
  });

  // ---------------------------------------------------------------------------
  // setScope()
  // ---------------------------------------------------------------------------

  describe('setScope()', () => {
    it('establece scopeType y scopeId correctamente', () => {
      store.setScope(WebScope.ASSOCIATION, 42);
      expect(store.scopeType()).toBe(WebScope.ASSOCIATION);
      expect(store.scopeId()).toBe(42);
    });

    it('fuerza scopeId a null cuando scopeType es GLOBAL', () => {
      store.setScope(WebScope.GLOBAL, 999 as any);
      expect(store.scopeType()).toBe(WebScope.GLOBAL);
      expect(store.scopeId()).toBeNull();
    });

    it('cuando scopeId es null en scope no-global, marca source como "unknown"', () => {
      store.setScope(WebScope.GAME, null);
      expect(store.source()).toBe('unknown');
      expect(store.scopeType()).toBe(WebScope.GAME);
      expect(store.scopeId()).toBeNull();
    });

    it('no actualiza previousScope si el tipo no cambia entre dos llamadas', () => {
      // Primera llamada: GLOBAL → ASSOCIATION guarda previous = GLOBAL
      store.setScope(WebScope.ASSOCIATION, 10);
      expect(store.previousScopeType()).toBe(WebScope.GLOBAL);
      const prevAfterFirst = store.previousScopeType();

      // Segunda llamada: ASSOCIATION → ASSOCIATION (mismo tipo) NO modifica previous
      store.setScope(WebScope.ASSOCIATION, 20);
      expect(store.previousScopeType()).toBe(prevAfterFirst); // sin cambio
      expect(store.previousScopeId()).toBeNull();             // sigue siendo el de GLOBAL
    });

    it('guarda previousScope cuando cambia el tipo', () => {
      store.setScope(WebScope.ASSOCIATION, 10);
      store.setScope(WebScope.GAME, 5);
      expect(store.previousScopeType()).toBe(WebScope.ASSOCIATION);
      expect(store.previousScopeId()).toBe(10);
    });

    it('actualiza el ID sin modificar previous cuando el tipo no cambia', () => {
      store.setScope(WebScope.GAME, 1);
      store.setScope(WebScope.GAME, 2);
      store.setScope(WebScope.GAME, 3);
      expect(store.scopeId()).toBe(3);
      // previous solo se guardó en el primer cambio desde GLOBAL
      expect(store.previousScopeType()).toBe(WebScope.GLOBAL);
    });

    it('acepta source personalizada', () => {
      store.setScope(WebScope.ASSOCIATION, 1, 'resource');
      expect(store.source()).toBe('resource');
    });

    it('actualiza updatedAt', () => {
      const before = store.updatedAt();
      store.setScope(WebScope.GAME, 1);
      expect(store.updatedAt()).toBeGreaterThanOrEqual(before);
    });
  });

  // ---------------------------------------------------------------------------
  // clear()
  // ---------------------------------------------------------------------------

  describe('clear()', () => {
    it('resetea al estado global', () => {
      store.setScope(WebScope.ASSOCIATION, 5);
      store.clear();
      expect(store.scopeType()).toBe(WebScope.GLOBAL);
      expect(store.scopeId()).toBeNull();
      expect(store.source()).toBe('manual');
      expect(store.isGlobal()).toBe(true);
    });
  });
});
