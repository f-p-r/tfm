import { WebScope } from '../../../core/web-scope.constants';

const HELP: Record<number, string> = {
  [WebScope.GLOBAL]: `
    <p>Panel de administración <strong>global</strong>. Desde aquí gestionas la plataforma
    completa: juegos, asociaciones, usuarios y contenido de alcance global.</p>
  `,
  [WebScope.ASSOCIATION]: `
    <p>Panel de administración de la <strong>asociación activa</strong>. Desde aquí gestionas
    los socios, noticias, eventos, páginas y contactos propios de esta asociación.</p>
  `,
  [WebScope.GAME]: `
    <p>Panel de administración del <strong>juego activo</strong>. Desde aquí gestionas
    el contenido (noticias, eventos, páginas) específico de este juego.</p>
  `,
};

export const getAdminPageHelp = (scope: number): string =>
  HELP[scope] ?? HELP[WebScope.GLOBAL];
