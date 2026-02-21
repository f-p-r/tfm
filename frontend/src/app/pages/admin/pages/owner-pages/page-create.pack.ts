import { HelpPack } from '../../../../shared/help/help.types';

/**
 * Pack de ayuda para el formulario de creación y edición de páginas de contenido.
 * Contiene textos de ayuda contextual para los campos del formulario.
 */
export const PAGE_CREATE_PACK: HelpPack = {
  screen: {
    title: 'Gestión de página',
    intro: 'Formulario para crear o editar una página de contenido. El título y el slug son obligatorios, y la página debe tener al menos un segmento de contenido para poder publicarse.',
    sections: [
      {
        title: 'Campos obligatorios',
        items: [
          'Título: nombre visible de la página en la web.',
          'Slug: fragmento de URL único que identifica la página.',
          'Contenido: al menos un segmento es necesario para guardar la página.',
        ],
      },
      {
        title: 'Publicación',
        items: [
          'Si "Página publicada" está marcado, la página será visible inmediatamente para todos los usuarios.',
          'Puedes dejarla como borrador desmarcando la opción y publicarla más tarde.',
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
      text: 'Nombre visible de la página. Aparece en el encabezado y en los menús de navegación. Es obligatorio.',
    },
    slug: {
      title: 'Slug (URL)',
      text: 'Identificador único de la página en la URL. Solo letras minúsculas, números y guiones. Ejemplos: contacto, sobre-nosotros, actividades. Debe ser único dentro del mismo ámbito.',
    },
    published: {
      title: 'Publicar página',
      text: 'Si está marcado, la página será visible inmediatamente para todos los usuarios. Sin marcar, permanece como borrador privado.',
    },
    classNames: {
      title: 'Clases CSS (avanzado)',
      text: 'Clases CSS adicionales para personalizar el diseño de la página. Solo se permiten clases con el prefijo ds-. Separa varias clases con espacios. Déjalo vacío si no necesitas personalización.',
    },
    content: {
      title: 'Contenido',
      text: 'Cuerpo principal de la página, compuesto por segmentos: texto enriquecido, imágenes, carruseles, etc. Debe contener al menos un segmento para poder guardar la página.',
    },
  },
};
