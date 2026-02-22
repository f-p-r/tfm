import { WebScope } from '../../../core/web-scope.constants';

const BASE = `
  <ul class="list-disc pl-4 mt-2 space-y-1">
    <li>El slug se genera automáticamente desde el título, pero es editable.</li>
    <li>Una noticia debe estar <strong>publicada</strong> para ser visible públicamente.</li>
    <li>Guarda como borrador para continuar editando sin publicar.</li>
  </ul>
`;

const HELP: Record<number, string> = {
  [WebScope.GLOBAL]: `<p>Editor de noticia de alcance <strong>global</strong>.</p>${BASE}`,
  [WebScope.ASSOCIATION]: `<p>Editor de noticia de la <strong>asociación activa</strong>.</p>${BASE}`,
  [WebScope.GAME]: `<p>Editor de noticia del <strong>juego activo</strong>.</p>${BASE}`,
};

export const getAdminNewsFormHelp = (scope: number): string =>
  HELP[scope] ?? HELP[WebScope.GLOBAL];
