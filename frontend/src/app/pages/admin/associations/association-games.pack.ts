import { HelpPack } from '../../../shared/help/help.types';

/**
 * Pack de ayuda para la gestión de juegos relacionados con asociaciones.
 * Contiene textos de ayuda contextual para los campos del formulario.
 */
export const ASSOCIATION_GAMES_HELP_PACK: HelpPack = {
  screen: {
    title: 'Juegos Relacionados',
    intro: 'Administra los juegos a los que está asociada esta organización. Puedes añadir nuevos juegos o eliminar asociaciones existentes.',
    sections: [
      {
        title: 'Gestión de asociaciones',
        items: [
          'Los cambios no se guardan hasta que pulses "Confirmar Cambios"',
          'Puedes añadir múltiples juegos antes de confirmar',
          'El botón "Cancelar" descarta todos los cambios pendientes',
        ],
      },
      {
        title: 'Selección de juegos',
        items: [
          'El desplegable solo muestra juegos aún no asociados',
          'Al añadir un juego, desaparece del desplegable automáticamente',
          'Al eliminar un juego, vuelve a aparecer en el desplegable',
        ],
      },
    ],
  },
  items: {
    game_selector: {
      title: 'Selector de juego',
      text: 'Selecciona un juego del desplegable para asociarlo. Solo se muestran juegos que aún no están relacionados con esta asociación.',
    },
    current_games: {
      title: 'Juegos asociados',
      text: 'Lista de juegos actualmente relacionados con la asociación. Puedes eliminar cualquiera de ellos.',
    },
    confirm_changes: {
      title: 'Confirmar cambios',
      text: 'Guarda todas las modificaciones realizadas (juegos añadidos y eliminados) en una sola operación.',
    },
    cancel_changes: {
      title: 'Cancelar',
      text: 'Descarta todos los cambios pendientes y vuelve a la página anterior.',
    },
  },
};
