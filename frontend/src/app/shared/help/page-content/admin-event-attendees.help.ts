import { WebScope } from '../../../core/web-scope.constants';

const BASE = `
  <ul class="list-disc pl-4 mt-2 space-y-1">
    <li><strong>Solicitud pendiente:</strong> el usuario ha solicitado inscripción, pendiente de revisión.</li>
    <li><strong>Admitido:</strong> el usuario tiene plaza confirmada en el evento.</li>
    <li><strong>Rechazado:</strong> la solicitud ha sido denegada.</li>
  </ul>
`;

const HELP: Record<number, string> = {
  [WebScope.GLOBAL]: `<p>Inscripciones de un evento <strong>global</strong>.</p>${BASE}`,
  [WebScope.ASSOCIATION]: `<p>Inscripciones de un evento de la <strong>asociación activa</strong>.</p>${BASE}`,
  [WebScope.GAME]: `<p>Inscripciones de un evento del <strong>juego activo</strong>.</p>${BASE}`,
};

export const getAdminEventAttendeesHelp = (scope: number): string =>
  HELP[scope] ?? HELP[WebScope.GLOBAL];
