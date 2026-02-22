import { WebScope } from '../../../core/web-scope.constants';

const BASE = `
  <ul class="list-disc pl-4 mt-2 space-y-1">
    <li>Las asociaciones en las que ya eres miembro aparecen destacadas.</li>
    <li>Solicita unirte y espera la confirmación del administrador de la asociación.</li>
  </ul>
`;

const HELP: Record<number, string> = {
  [WebScope.GLOBAL]: `<p>Todas las asociaciones registradas en la plataforma.</p>${BASE}`,
  [WebScope.GAME]: `<p>Asociaciones que practican o están vinculadas a este <strong>juego</strong>.</p>${BASE}`,
};

export const getAssociationsHelp = (scope: number): string =>
  HELP[scope] ?? HELP[WebScope.GLOBAL];
