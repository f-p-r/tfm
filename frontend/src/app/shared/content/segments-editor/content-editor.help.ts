import { HelpPack } from '../../help/help.types';

export const CONTENT_EDITOR_HELP: HelpPack = {
  items: {
    // --- LAYOUT ---
    'col_dist': {
      title: 'Distribución de Columnas',
      text: 'Elige cómo dividir el espacio. "Ancho completo" es ideal para texto simple. Las columnas se apilan verticalmente en móviles.'
    },
    'col_padding': {
      title: 'Espaciado Vertical',
      text: 'Añade aire arriba y abajo. Usa "Normal" por defecto y "Amplio" si utilizas fondos de color para separar secciones.'
    },
    'col_bg': {
      title: 'Color de Fondo',
      text: 'Cambia el fondo de la sección. El color del texto se ajusta automáticamente para ser legible.'
    },
    'col_text_color': {
      title: 'Color del Texto',
      text: 'Elige el color principal del texto. Usa "Blanco" si has elegido un fondo oscuro (como Marca Oscuro) para que sea legible.'
    },
    'col_width': {
      title: 'Ancho del Contenido',
      text: '"Estándar" se alinea con la web (1150px). "Lectura" es más estrecho para artículos. "Completo" ocupa toda la pantalla.'
    },
    'col_id': {
      title: 'Identificador (ID)',
      text: 'Opcional. Escribe un nombre único (ej: "contacto") para poder crear enlaces en el menú que lleven aquí.'
    },
    'col_class': {
      title: 'Clases CSS',
      text: 'Avanzado. Añade clases manuales del Design System separadas por espacio.'
    },

    // --- CARRUSEL ---
    'car_height': {
      title: 'Altura Fija',
      text: 'Altura en píxeles del carrusel. Las imágenes se recortarán para llenar este espacio.'
    },
    'car_per_view': {
      title: 'Imágenes Visibles',
      text: 'Número de imágenes a mostrar simultáneamente en pantallas grandes.'
    },
    'car_delay': {
      title: 'Auto-avance',
      text: 'Segundos entre cambios de imagen. Pon 0 para desactivar el movimiento automático.'
    }
  }
};
