import { WebScope } from '../../../core/web-scope.constants';

const HELP: Record<number, string> = {
  [WebScope.GLOBAL]: `<p>Últimas noticias de la <strong>plataforma</strong>.</p>`,
  [WebScope.ASSOCIATION]: `<p>Últimas noticias de la <strong>asociación</strong>.</p>`,
  [WebScope.GAME]: `<p>Últimas noticias del <strong>juego</strong>.</p>`,
};

export const getNewsListHelp = (scope: number): string =>
  HELP[scope] ?? HELP[WebScope.GLOBAL];
