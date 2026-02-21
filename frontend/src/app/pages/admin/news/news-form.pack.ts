import { HelpPack } from '../../../shared/help/help.types';

/**
 * Pack de ayuda para el formulario de creación y edición de noticias.
 * Contiene textos de ayuda contextual para los campos del formulario.
 */
export const NEWS_FORM_PACK: HelpPack = {
  screen: {
    title: 'Gestión de noticia',
    intro: 'Formulario para crear o editar una noticia. Los campos Título, Slug y Texto son obligatorios.',
    sections: [
      {
        title: 'Campos obligatorios',
        items: [
          'Título: nombre visible de la noticia.',
          'Slug: identificador único en la URL.',
          'Texto: resumen introductorio para listados y tarjetas.',
        ],
      },
      {
        title: 'Contenido enriquecido',
        items: [
          'El contenido completo es opcional.',
          'Si se añaden segmentos, se mostrarán en la página de detalle de la noticia.',
        ],
      },
    ],
  },
  items: {
    title: {
      title: 'Título',
      text: 'Nombre visible de la noticia. Aparece en listados, tarjetas y en la cabecera del detalle.',
    },
    slug: {
      title: 'Slug (URL)',
      text: 'Identificador único de la noticia en la URL. Ejemplos: nueva-temporada-2026, campeones-regionales. No es necesario que sea único globalmente.',
    },
    text: {
      title: 'Texto introductorio',
      text: 'Resumen breve de la noticia. Se muestra en tarjetas y listados, antes de acceder al detalle completo.',
    },
    published: {
      title: 'Publicar',
      text: 'Si está marcado, la noticia será visible para todos los usuarios. Si no, permanecerá como borrador.',
    },
    gameId: {
      title: 'Juego relacionado',
      text: 'Juego específico al que hace referencia esta noticia, dentro del ámbito de la asociación. Es opcional.',
    },
    classNames: {
      title: 'Clases CSS',
      text: 'Clases CSS adicionales para personalizar el estilo del contenido. Solo se permiten clases con prefijo ds-. Sepáralas con espacios.',
    },
    content: {
      title: 'Contenido segmentado',
      text: 'Contenido enriquecido de la noticia, compuesto por segmentos de texto, imágenes y carruseles. Es opcional.',
    },
  },
};
