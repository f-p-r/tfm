import { HelpPack } from '../../../../shared/help/help.types';

/**
 * Pack de ayuda para el modal de edición de asociaciones.
 * Contiene textos de ayuda contextual para los campos del formulario.
 */
export const ASSOCIATION_EDIT_HELP: HelpPack = {
  screen: {
    title: 'Crear / Editar asociación',
    intro: 'Completa los campos del formulario. Los marcados con * son obligatorios.',
    sections: [
      {
        title: 'Identificación',
        items: [
          'El nombre es el título completo visible para los usuarios.',
          'El slug define la URL pública (ej: /asociaciones/mi-club).',
          'El nombre corto se usa en espacios reducidos (máx. 20 caracteres).',
        ],
      },
      {
        title: 'Ubicación y Contacto',
        items: [
          'Selecciona primero el país para habilitar el selector de región.',
          'La web externa es opcional y debe comenzar por https://.',
        ],
      },
      {
        title: 'Configuración',
        items: [
          'El responsable es el usuario que administra la asociación.',
          'Las asociaciones deshabilitadas no son visibles públicamente.',
        ],
      },
    ],
  },
  items: {
    name: {
      title: 'Nombre',
      text: 'Nombre completo de la asociación, club o entidad. Este es el nombre que verán los usuarios.'
    },
    slug: {
      title: 'Slug (URL)',
      text: 'Identificador único para la URL de la asociación. Usa solo letras minúsculas, números y guiones. Ejemplo: club-ajedrez-madrid'
    },
    shortname: {
      title: 'Nombre Corto',
      text: 'Versión abreviada del nombre (máximo 20 caracteres) que se usa en espacios reducidos. Ejemplo: CAM'
    },
    description: {
      title: 'Descripción',
      text: 'Descripción breve de la asociación, sus actividades y objetivos.'
    },
    country: {
      title: 'País',
      text: 'País en el que está ubicada la asociación. Este campo es obligatorio si deseas especificar una región.'
    },
    region: {
      title: 'Región',
      text: 'Comunidad autónoma o región específica donde opera la asociación. Primero debes seleccionar un país.'
    },
    owner: {
      title: 'Responsable',
      text: 'Usuario responsable de administrar la asociación. Busca por nombre de usuario (username).'
    },
    web: {
      title: 'Web Externa',
      text: 'URL del sitio web externo de la asociación. Ejemplo: https://www.miasociacion.com'
    },
    management: {
      title: 'Gestión desde Naipeando',
      text: 'Indica si la asociación tiene gestión activa dentro del sistema Naipeando.'
    },
    disabled: {
      title: 'Estado',
      text: 'Si está marcado como deshabilitado, la asociación no será visible públicamente.'
    }
  }
};
