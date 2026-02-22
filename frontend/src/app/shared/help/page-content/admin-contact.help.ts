import { WebScope } from '../../../core/web-scope.constants';

const BASE = `
  <ul class="list-disc pl-4 mt-2 space-y-1">
    <li>Cada tipo de contacto tiene un límite máximo de entradas.</li>
    <li>Los cambios son visibles de inmediato en la página de contacto pública.</li>
  </ul>
`;

const HELP: Record<number, string> = {
  [WebScope.GLOBAL]: `<p>Contactos visibles en la página de contacto <strong>global</strong> de la plataforma.</p>${BASE}`,
  [WebScope.ASSOCIATION]: `<p>Contactos visibles en la página de contacto de la <strong>asociación activa</strong>.</p>${BASE}`,
  [WebScope.GAME]: `<p>Contactos visibles en la página de contacto del <strong>juego activo</strong>.</p>${BASE}`,
};

export const getAdminContactHelp = (scope: number): string =>
  HELP[scope] ?? HELP[WebScope.GLOBAL];
