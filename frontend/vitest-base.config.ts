// Learn more about Vitest configuration options at https://vitest.dev/config/
// Usado por @angular/build:unit-test (ng test).
// Angular aporta la compilación; este archivo solo configura el runner Vitest.

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Expone describe/it/expect como globales (alineado con tsconfig.spec.json)
    globals: true,
    // jsdom simula el DOM del navegador para tests de componentes
    environment: 'jsdom',
    // Nota: test.include NO se usa aquí — Angular CLI gestiona el descubrimiento de archivos
  },
});
