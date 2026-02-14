import { HelpPack } from '../../../../shared/help/help.types';

/**
 * Pack de ayuda para la página de creación de páginas
 * Contiene textos de ayuda contextual para los campos del formulario
 */
export const PAGE_CREATE_PACK: HelpPack = {
  screen: {
    title: 'Crear nueva página',
    intro: 'Formulario para crear una nueva página de contenido.',
    sections: [
      { title: 'Campos obligatorios', items: ['Título y slug son obligatorios.', 'La página debe tener al menos un segmento de contenido.'] },
    ],
  },
  items: {
    title: {
      title: 'Título',
      text: 'El título de la página que se mostrará a los usuarios. Es obligatorio.',
    },
    slug: {
      title: 'Slug (URL)',
      text: 'Identificador único de la página en la URL. Debe ser único dentro del owner actual. Ejemplos: contacto, actividades, noticias.',
    },
    published: {
      title: 'Publicar',
      text: 'Si está marcado, la página será visible inmediatamente. Si no, se creará como borrador.',
    },
    classNames: {
      title: 'Clases CSS',
      text: 'Clases CSS adicionales para personalizar el estilo de la página. Solo se permiten clases con prefijo ds-. Sepáralas con espacios.',
    },
    content: {
      title: 'Contenido',
      text: 'Añade segmentos de contenido a la página. Debe tener al menos un segmento. Puedes añadir texto, imágenes, carruseles, etc.',
    },
  },
};
