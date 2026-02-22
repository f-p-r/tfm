import { WebScope } from '../../../core/web-scope.constants';

const HELP: Record<number, string> = {
  [WebScope.GLOBAL]: `
    <p>Noticias de alcance <strong>global</strong>: visibles en toda la plataforma.
    Incluye borradores y noticias publicadas.</p>
    <ul class="list-disc pl-4 mt-2 space-y-1">
      <li>Los borradores solo son visibles para administradores.</li>
      <li>Una noticia publicada es visible para todos los usuarios de la plataforma.</li>
    </ul>
  `,
  [WebScope.ASSOCIATION]: `
    <p>Noticias de la <strong>asociación activa</strong>: visibles solo a los usuarios
    que accedan al espacio de esta asociación.</p>
    <ul class="list-disc pl-4 mt-2 space-y-1">
      <li>Los borradores solo son visibles para los administradores de la asociación.</li>
      <li>Una noticia publicada es visible para todos los visitantes de la asociación.</li>
    </ul>
  `,
  [WebScope.GAME]: `
    <p>Noticias del <strong>juego activo</strong>: visibles solo a los usuarios
    que accedan al espacio de este juego.</p>
    <ul class="list-disc pl-4 mt-2 space-y-1">
      <li>Los borradores solo son visibles para los administradores del juego.</li>
      <li>Una noticia publicada es visible para todos los visitantes del juego.</li>
    </ul>
  `,
};

export const getAdminNewsListHelp = (scope: number): string =>
  HELP[scope] ?? HELP[WebScope.GLOBAL];
