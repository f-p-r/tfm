import { HelpPack } from '../../shared/help/help.types';

/**
 * Pack de ayuda para la demo de help-demo
 * Contiene textos de ayuda contextual para campos del formulario
 */
export const HELP_DEMO_PACK: HelpPack = {
  screen: {
    title: 'Ayuda (demo)',
    intro: 'Ejemplo de ayuda contextual de pantalla + microayuda por campo.',
    sections: [
      { title: 'Campos', items: ['Pasa el ratón en desktop o activa ⓘ en móvil.'] },
    ],
  },
  items: {
    email: {
      title: 'Email',
      text: 'Usa un email válido. Lo utilizaremos para iniciar sesión.',
    },
    privacy: {
      title: 'Privacidad',
      text: 'Elige quién puede ver tu perfil. Puedes cambiarlo más adelante.',
    },
    description: {
      title: 'Descripción',
      text: 'Cuenta brevemente qué quieres conseguir.',
    },
    clear: {
      title: 'Limpiar',
      text: 'Reinicia el formulario y borra los cambios.',
    },
  },
};
