import { HelpPack } from '../../shared/help/help.types';

/**
 * Pack de ayuda para el formulario de registro de nuevo usuario.
 * Contiene textos de ayuda contextual para los campos del formulario.
 */
export const REGISTRO_FORM_PACK: HelpPack = {
  screen: {
    title: 'Crear cuenta',
    intro: 'Completa el formulario para crear tu cuenta en Naipeando. Todos los campos son obligatorios.',
    sections: [
      {
        title: 'Identificación',
        items: [
          'El nombre completo es el nombre con el que aparecerás en el perfil.',
          'El nombre de usuario es el identificador único visible públicamente.',
          'El email se usará para iniciar sesión y recibir notificaciones.',
        ],
      },
      {
        title: 'Seguridad',
        items: [
          'La contraseña debe tener al menos 8 caracteres.',
          'Confirma la contraseña para asegurarte de que no hay erratas.',
        ],
      },
    ],
  },
  items: {
    name: {
      title: 'Nombre completo',
      text: 'Tu nombre real o el nombre con el que quieres aparecer en la plataforma. Será visible en tu perfil público.',
    },
    username: {
      title: 'Nombre de usuario',
      text: 'Identificador único público. Solo letras, números y guiones. Ejemplo: jperez. No podrás cambiarlo después sin contactar con el administrador.',
    },
    email: {
      title: 'Email',
      text: 'Dirección de correo electrónico con la que iniciarás sesión. Debe ser válida; la usaremos para enviarte notificaciones importantes.',
    },
    password: {
      title: 'Contraseña',
      text: 'Mínimo 8 caracteres. Te recomendamos usar una combinación de letras, números y símbolos para mayor seguridad.',
    },
    passwordConfirmation: {
      title: 'Confirmar contraseña',
      text: 'Repite la contraseña exactamente igual para confirmar que no hay erratas.',
    },
  },
};
