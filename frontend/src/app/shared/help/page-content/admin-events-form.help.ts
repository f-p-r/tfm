import { WebScope } from '../../../core/web-scope.constants';

const BASE = `
  <ul class="list-disc pl-4 mt-2 space-y-1">
    <li>Activa <strong>Inscripción abierta</strong> para que los usuarios puedan solicitar asistencia.</li>
    <li>El evento debe estar <strong>activo y publicado</strong> para aparecer en el listado público.</li>
    <li>Desde el listado puedes acceder a la gestión de inscripciones de cada evento.</li>
  </ul>
`;

const HELP: Record<number, string> = {
  [WebScope.GLOBAL]: `<p>Editor de evento de alcance <strong>global</strong>.</p>${BASE}`,
  [WebScope.ASSOCIATION]: `<p>Editor de evento de la <strong>asociación activa</strong>.</p>${BASE}`,
  [WebScope.GAME]: `<p>Editor de evento del <strong>juego activo</strong>.</p>${BASE}`,
};

export const getAdminEventsFormHelp = (scope: number): string =>
  HELP[scope] ?? HELP[WebScope.GLOBAL];
