import { WebScope } from '../../../core/web-scope.constants';

const HELP: Record<number, string> = {
  [WebScope.GLOBAL]: `
  <p>Bienvenido al sistema de ayuda. Aquí encontrarás información sobre cómo usar la página en la que te encuentras.</p>
  <ul>
    <li>Navega por las distintas secciones usando el menú principal.</li>
    <li>Las páginas con ayuda específica mostrarán información detallada en este panel.</li>
    <li>Puedes seleccionar un juego específico o volver a la vista general seleccionándolo en el desplegable a continuación del logo, en la barra superior.</li>
    <li>Puedes cerrar este panel en cualquier momento.</li>
  </ul>
  `,
  [WebScope.ASSOCIATION]: `
  <p>Bienvenido al sistema de ayuda. Aquí encontrarás información sobre cómo usar la página en la que te encuentras.</p>
  <ul>
    <li>Navega por las distintas secciones usando el menú principal.</li>
    <li>Las páginas con ayuda específica mostrarán información detallada en este panel.</li>
    <li>Clica en el desplegable con el nombre de la asociación, en la barra superior, para ver las opciones o para salir de la web de la asociación</li>
    <li>Puedes cerrar este panel en cualquier momento.</li>
  </ul>
  `,
};

export const getDefaultPageHelp = (scope: number): string =>
  HELP[scope] ?? HELP[WebScope.GLOBAL];
