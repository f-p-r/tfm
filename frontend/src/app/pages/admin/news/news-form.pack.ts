import { HelpPack } from '../../../shared/help/help.types';

/**
 * Pack de ayuda para el formulario de creación y edición de noticias.
 * Contiene textos de ayuda contextual para los campos del formulario.
 */
export const NEWS_FORM_PACK: HelpPack = {
  screen: {
    title: 'Gestión de noticia',
    intro: 'Formulario para crear o editar una noticia. El título, el slug y el texto introductorio son obligatorios.',
    sections: [
      {
        title: 'Campos obligatorios',
        items: [
          'Título: nombre visible de la noticia en listados y tarjetas.',
          'Slug: fragmento de URL único que identifica la noticia.',
          'Texto introductorio: resumen breve que aparece en listados y tarjetas antes de abrir el detalle.',
        ],
      },
      {
        title: 'Contenido enriquecido',
        items: [
          'El contenido segmentado es opcional.',
          'Si se añaden segmentos (texto, imágenes, carruseles…), se mostrarán en la página de detalle de la noticia.',
        ],
      },
      {
        title: 'Publicación',
        items: [
          'Marca "Publicada" para que la noticia sea visible de inmediato.',
          'Sin marcar, la noticia permanece como borrador privado.',
        ],
      },
      {
        title: 'Consejo',
        items: [
          'Pasa el ratón sobre cada campo para ver su ayuda específica.',
        ],
      },
    ],
  },
  items: {
    title: {
      title: 'Título',
      text: 'Nombre visible de la noticia. Aparece en listados, tarjetas y en la cabecera del detalle. Máximo 40 caracteres.',
    },
    slug: {
      title: 'Slug (URL)',
      text: 'Identificador único de la noticia en la URL. Solo letras minúsculas, números y guiones. Ejemplos: nueva-temporada-2026, campeones-regionales. Máximo 25 caracteres.',
    },
    text: {
      title: 'Texto introductorio',
      text: 'Resumen breve de la noticia. Se muestra en tarjetas y listados, antes de acceder al detalle completo. Es obligatorio.',
    },
    published: {
      title: 'Publicar noticia',
      text: 'Si está marcado, la noticia será visible para todos los usuarios. Sin marcar, permanece como borrador privado.',
    },
    gameId: {
      title: 'Juego relacionado',
      text: 'Juego específico al que hace referencia esta noticia, dentro del ámbito de la asociación. Es opcional — déjalo en blanco si la noticia es general.',
    },
    classNames: {
      title: 'Clases CSS del contenido (avanzado)',
      text: 'Clases CSS adicionales aplicadas al bloque de contenido enriquecido. Solo se permiten clases con el prefijo ds-. Separa varias con espacios. Déjalo vacío si no necesitas personalización.',
    },
    content: {
      title: 'Contenido segmentado',
      text: 'Cuerpo extendido de la noticia: texto enriquecido, imágenes, carruseles, etc. Es opcional — si no se añaden segmentos, solo se mostrará el texto introductorio en el detalle.',
    },
  },
};
