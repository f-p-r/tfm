import { HelpPack } from '../../../../shared/help/help.types';

/**
 * Pack de ayuda para la gestión de roles de usuario.
 */
export const USER_ROLE_MANAGEMENT_HELP: HelpPack = {
  items: {
    role: {
      title: 'Rol',
      text: 'Rol que se asigna al usuario. "admin" tiene permisos completos de administración, "editor" puede crear y editar contenido.'
    },
    scopeType: {
      title: 'Tipo de Ámbito',
      text: 'Ámbito de aplicación del rol. "Global" aplica a todo el sistema, "Asociación" limita a una asociación específica, "Juego" limita a un juego específico.'
    },
    scope: {
      title: 'Ámbito',
      text: 'Entidad específica donde se aplica el rol. "Todos" otorga el rol globalmente para ese tipo de ámbito. Si seleccionas una asociación o juego específico, el rol solo aplicará en ese contexto.'
    },
    resetPassword: {
      title: 'Restablecer Contraseña',
      text: 'Genera una nueva contraseña temporal para el usuario y se la envía por correo electrónico.'
    }
  }
};
