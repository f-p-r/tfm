import { slugify } from './slugify';

describe('slugify()', () => {

  // ── Casos del docblock ────────────────────────────────────────────────────

  it('"Siete y medio" → "siete-y-medio"', () => {
    expect(slugify('Siete y medio')).toBe('siete-y-medio');
  });

  it('"Guiñote" → "guinote" (elimina diacríticos)', () => {
    expect(slugify('Guiñote')).toBe('guinote');
  });

  it('"Póker Texas Hold\'em" → "poker-texas-holdem" (el apóstrofe se elimina)', () => {
    // El apóstrofe no es espacio ni guión, así que se elimina en [^a-z0-9-]
    // sin insertar guión entre "hold" y "em"
    expect(slugify("Póker Texas Hold'em")).toBe('poker-texas-holdem');
  });

  // ── Acentos y caracteres especiales ──────────────────────────────────────

  it('elimina tildes: "Álgebra" → "algebra"', () => {
    expect(slugify('Álgebra')).toBe('algebra');
  });

  it('elimina diéresis: "Müller" → "muller"', () => {
    expect(slugify('Müller')).toBe('muller');
  });

  it('elimina ñ: "España" → "espana"', () => {
    expect(slugify('España')).toBe('espana');
  });

  // ── Normalización de espacios y guiones ───────────────────────────────────

  it('múltiples espacios → un solo guión', () => {
    expect(slugify('hola   mundo')).toBe('hola-mundo');
  });

  it('colapsa guiones consecutivos', () => {
    expect(slugify('hola---mundo')).toBe('hola-mundo');
  });

  it('elimina guión al inicio', () => {
    expect(slugify('-hola')).toBe('hola');
  });

  it('elimina guión al final', () => {
    expect(slugify('hola-')).toBe('hola');
  });

  it('elimina espacios al inicio y final', () => {
    expect(slugify('  hola mundo  ')).toBe('hola-mundo');
  });

  // ── Caracteres no permitidos ──────────────────────────────────────────────

  it('elimina caracteres especiales como @, #, !', () => {
    expect(slugify('hola@mundo!')).toBe('holamundo');
  });

  it('conserva números', () => {
    expect(slugify('Counter Strike 2')).toBe('counter-strike-2');
  });

  it('cadena vacía → cadena vacía', () => {
    expect(slugify('')).toBe('');
  });

  it('solo espacios → cadena vacía', () => {
    expect(slugify('   ')).toBe('');
  });

  // ── Límite de longitud ────────────────────────────────────────────────────

  it('limita la longitud a 64 caracteres', () => {
    const largo = 'a'.repeat(100);
    expect(slugify(largo).length).toBe(64);
  });

  it('texto de exactamente 64 caracteres no se trunca', () => {
    const texto = 'a'.repeat(64);
    expect(slugify(texto)).toBe(texto);
  });
});
