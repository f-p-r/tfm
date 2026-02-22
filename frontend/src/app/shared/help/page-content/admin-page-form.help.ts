import { WebScope } from '../../../core/web-scope.constants';

const BASE = `
  <ul class="list-disc pl-4 mt-2 space-y-1">
    <li>Usa el botón <strong>Vista previa</strong> para ver cómo quedará antes de guardar.</li>
    <li>El slug debe ser único dentro del scope y no contiene espacios ni mayúsculas.</li>
  </ul>
`;

const HELP: Record<number, string> = {
  [WebScope.GLOBAL]: `<p>Editor de página de contenido de alcance <strong>global</strong>.</p>${BASE}`,
  [WebScope.ASSOCIATION]: `<p>Editor de página de contenido de la <strong>asociación activa</strong>.</p>${BASE}`,
  [WebScope.GAME]: `<p>Editor de página de contenido del <strong>juego activo</strong>.</p>${BASE}`,
};

export const getAdminPageFormHelp = (scope: number): string =>
  HELP[scope] ?? HELP[WebScope.GLOBAL];
