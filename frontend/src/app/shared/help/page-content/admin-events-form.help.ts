import { WebScope } from '../../../core/web-scope.constants';

const BASE = `
  <ul class="list-disc pl-4 mt-2 space-y-1">
    <li>Activa <strong>Inscripción abierta</strong> para que los usuarios puedan solicitar asistencia.</li>
    <li>El evento debe estar <strong>activo y publicado</strong> para aparecer en el listado público.</li>
    <li>Desde el listado puedes acceder a la gestión de inscripciones de cada evento.</li>
    <li>Añade bloques de contenido con el botón <strong>+ Bloque Contenido</strong>.</li>
    <li>Añade bloques de carrusel para mostrar varias imágenes</li>
    <li>Define el estilo de los bloques. Ordénalos con las flechas de desplazamiento ⬆⬇</li>
    <li>Los cambios no se guardarán hasta que pulses el botón <strong>Guardar cambios</strong>, en la parte inferior de la pantalla. Recuerda guardar periódicamente si vas a hacer muchos cambios.</li>

  </ul>
`;

const HELP: Record<number, string> = {
  [WebScope.GLOBAL]: `<p>Editor de evento de alcance <strong>global</strong>.</p>${BASE}`,
  [WebScope.ASSOCIATION]: `<p>Editor de evento de la <strong>asociación activa</strong>.</p>${BASE}`,
  [WebScope.GAME]: `<p>Editor de evento del <strong>juego activo</strong>.</p>${BASE}`,
};

export const getAdminEventsFormHelp = (scope: number): string =>
  HELP[scope] ?? HELP[WebScope.GLOBAL];
