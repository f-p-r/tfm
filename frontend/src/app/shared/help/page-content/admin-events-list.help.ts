import { WebScope } from '../../../core/web-scope.constants';

const BASE = `
  <ul class="list-disc pl-4 mt-2 space-y-1">
    <li>Un evento debe estar <strong>activo y publicado</strong> para ser visible públicamente.</li>
    <li>Activa la inscripción para permitir que los usuarios soliciten asistencia.</li>
  </ul>
`;

const HELP: Record<number, string> = {
  [WebScope.GLOBAL]: `<p>Eventos de alcance <strong>global</strong>: visibles en toda la plataforma.</p>${BASE}`,
  [WebScope.ASSOCIATION]: `<p>Eventos de la <strong>asociación activa</strong>: visibles solo en el espacio de esta asociación.</p>${BASE}`,
  [WebScope.GAME]: `<p>Eventos del <strong>juego activo</strong>: visibles solo en el espacio de este juego.</p>${BASE}`,
};

export const getAdminEventsListHelp = (scope: number): string =>
  HELP[scope] ?? HELP[WebScope.GLOBAL];
