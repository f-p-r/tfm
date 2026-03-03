import { WebScope } from '../../../core/web-scope.constants';

const BASE = `
  <ul class="list-disc pl-4 mt-2 space-y-1">
    <li>El slug se genera automáticamente desde el título, pero es editable.</li>
    <li>Una noticia debe estar <strong>publicada</strong> para ser visible públicamente.</li>
    <li>Guarda como borrador para continuar editando sin publicar.</li>
    <li>Añade bloques de contenido con el botón <strong>+ Bloque Contenido</strong>.</li>
    <li>Añade bloques de carrusel para mostrar varias imágenes</li>
    <li>Define el estilo de los bloques. Ordénalos con las flechas de desplazamiento ⬆⬇</li>
    <li>Los cambios no se guardarán hasta que pulses el botón <strong>Guardar cambios</strong>, en la parte inferior de la pantalla. Recuerda guardar periódicamente si vas a hacer muchos cambios.</li>

  </ul>
`;

const HELP: Record<number, string> = {
  [WebScope.GLOBAL]: `<p>Editor de noticia de alcance <strong>global</strong>.</p>${BASE}`,
  [WebScope.ASSOCIATION]: `<p>Editor de noticia de la <strong>asociación activa</strong>.</p>${BASE}`,
  [WebScope.GAME]: `<p>Editor de noticia del <strong>juego activo</strong>.</p>${BASE}`,
};

export const getAdminNewsFormHelp = (scope: number): string =>
  HELP[scope] ?? HELP[WebScope.GLOBAL];
