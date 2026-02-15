import { HelpPack } from '../help.types';

/**
 * Pack de ayuda para el modal de edición de contactos.
 * Contiene textos de ayuda contextual para los campos del formulario.
 */
export const CONTACT_EDIT_HELP_PACK: HelpPack = {
  screen: {
    title: 'Gestión de Contactos',
    intro: 'Configura los canales de contacto que se mostrarán públicamente en tu organización.',
    sections: [
      {
        title: 'Límites por tipo',
        items: [
          'Emails: ilimitados (requiere categoría)',
          'Teléfonos: máximo 2',
          'WhatsApp: ilimitados (requiere categoría)',
          'Redes sociales: 1 por plataforma',
        ],
      },
      {
        title: 'Visibilidad',
        items: [
          'Los contactos marcados como "Público" aparecerán en la página de contacto.',
          'Los contactos privados solo serán visibles para administradores.',
        ],
      },
    ],
  },
  items: {
    contact_type: {
      title: 'Tipo de contacto',
      text: 'Selecciona el tipo de canal de comunicación. Algunos tipos tienen límites de cantidad.',
    },
    value: {
      title: 'Valor',
      text: 'Introduce el email, teléfono, usuario o URL según el tipo seleccionado. Se validará el formato automáticamente.',
    },
    category: {
      title: 'Categoría',
      text: 'Clasifica el contacto para organizarlo mejor. Requerido para emails, teléfonos y WhatsApp.',
    },
    label: {
      title: 'Etiqueta',
      text: 'Nombre descriptivo opcional que se mostrará junto al contacto (ej: "Contabilidad", "Atención al socio").',
    },
    order: {
      title: 'Orden',
      text: 'Número que determina la posición de visualización. Los valores más bajos aparecen primero.',
    },
    is_public: {
      title: 'Público',
      text: 'Si está activado, el contacto será visible en la página pública. Desactívalo para mantenerlo privado.',
    },
  },
};
