import { WebScope } from '../../../core/web-scope.constants';

const BASE = `
  <ul class="list-disc pl-4 mt-2 space-y-1">
    <li>Las páginas publicadas son accesibles desde la URL <code>/paginas/slug</code>.</li>
    <li>Puedes previsualizar el contenido antes de publicar.</li>
  </ul>
`;

const HELP: Record<number, string> = {
  [WebScope.GLOBAL]: `<p>Páginas de contenido estático de alcance <strong>global</strong>.</p>${BASE}`,
  [WebScope.ASSOCIATION]: `<p>Páginas de contenido estático de la <strong>asociación activa</strong>.</p>${BASE}`,
  [WebScope.GAME]: `<p>Páginas de contenido estático del <strong>juego activo</strong>.</p>${BASE}`,
};

export const getAdminPagesListHelp = (scope: number): string =>
  HELP[scope] ?? HELP[WebScope.GLOBAL];
