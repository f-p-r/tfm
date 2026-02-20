import { HelpPack } from '../../shared/help/help.types';

/**
 * Pack de ayuda contextual para la página de perfil de usuario.
 */
export const PERFIL_HELP: HelpPack = {
  items: {
    name: {
      title: 'Nombre completo',
      text: 'Tu nombre completo tal y como quieres que aparezca en la plataforma. Solamente será visible por las asociaciones a las que te unas, no es público.',
    },
    email: {
      title: 'Email',
      text: 'Tu dirección de correo electrónico principal. Se utilizará para notificaciones y recuperación de cuenta. Asegúrate de que sea válida y que tengas acceso a ella.',
    },
    password: {
      title: 'Nueva contraseña',
      text: 'Introduce una contraseña segura de al menos 8 caracteres. Se recomienda incluir mayúsculas, minúsculas, números y símbolos para mayor seguridad.',
    },
    passwordConfirmation: {
      title: 'Confirmar contraseña',
      text: 'Vuelve a escribir la nueva contraseña para confirmar que la has introducido correctamente. Ambas contraseñas deben coincidir.',
    },
  },
};
