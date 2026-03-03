import { WebScope } from '../../../core/web-scope.constants';

const BASE = `
  <ul class="list-disc pl-4 mt-2 space-y-1">
    <li>Usa el botón <strong>Vista previa</strong> para ver cómo quedará antes de guardar.</li>
    <li>El slug debe ser único dentro del scope y no contiene espacios ni mayúsculas.</li>
    <li>Añade bloques de contenido con el botón <strong>+ Bloque Contenido</strong>.</li>
    <li>Añade bloques de carrusel para mostrar varias imágenes</li>
    <li>Define el estilo de los bloques. Ordénalos con las flechas de desplazamiento ⬆⬇</li>
    <li>Los cambios no se guardarán hasta que pulses el botón <strong>Guardar cambios</strong>, en la parte inferior de la pantalla. Recuerda guardar periódicamente si vas a hacer muchos cambios.</li>
  </ul>
`;

const HELP: Record<number, string> = {
  [WebScope.GLOBAL]: `<p>Editor de página de contenido de alcance <strong>global</strong>.</p>${BASE}`,
  [WebScope.ASSOCIATION]: `<p>Editor de página de contenido de la <strong>asociación activa</strong>.</p>${BASE}`,
  [WebScope.GAME]: `<p>Editor de página de contenido del <strong>juego activo</strong>.</p>${BASE}`,
};

export const getAdminPageFormHelp = (scope: number): string =>
  HELP[scope] ?? HELP[WebScope.GLOBAL];
