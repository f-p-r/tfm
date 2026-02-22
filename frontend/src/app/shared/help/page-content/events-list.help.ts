import { WebScope } from '../../../core/web-scope.constants';

const BASE = `
  <ul class="list-disc pl-4 mt-2 space-y-1">
    <li>Si la inscripción está abierta puedes solicitar tu plaza desde la tarjeta del evento.</li>
    <li>El estado de tu solicitud aparece en la tarjeta una vez enviada.</li>
    <li>Pulsa en el título del evento para ver más detalles.</li>
  </ul>
`;

const HELP: Record<number, string> = {
  [WebScope.GLOBAL]: `<p>Próximos eventos y torneos de la <strong>plataforma</strong>.</p>${BASE}`,
  [WebScope.ASSOCIATION]: `<p>Próximos eventos y torneos de la <strong>asociación</strong>.</p>${BASE}`,
  [WebScope.GAME]: `<p>Próximos eventos y torneos del <strong>juego</strong>.</p>${BASE}`,
};

export const getEventsListHelp = (scope: number): string =>
  HELP[scope] ?? HELP[WebScope.GLOBAL];
