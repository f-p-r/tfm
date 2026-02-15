/**
 * Definición de acciones disponibles en el menú de administración
 * organizadas por scope (Global, Asociación, Juego).
 */

import { WebScope } from '../web-scope.constants';

export interface AdminAction {
  label: string;
  route: string;
  permission: string;
  icon: string;
  category: string;
  helpKey?: string;
  iconClass?: string;
}

/**
 * Acciones de administración para Scope Global (WebScope.GLOBAL)
 */
export const GLOBAL_ADMIN_ACTIONS: ReadonlyArray<AdminAction> = [
  { label: 'Páginas', route: '/admin/pages/1', permission: 'pages.edit', icon: '📄', category: 'Contenido' },
  { label: 'Contactos', route: '/admin/contactos', permission: 'admin', icon: '📞', category: 'Contenido' },
  { label: 'Asociaciones', route: '/admin/asociaciones', permission: 'admin', icon: '🏛️', category: 'Gestión' },
  { label: 'Juegos', route: '/admin/juegos', permission: 'admin', icon: '🎴', category: 'Gestión' },
  { label: 'Usuarios', route: '/admin/usuarios', permission: 'admin', icon: '👥', category: 'Gestión' },
  { label: 'Medios', route: '/admin/media', permission: 'global.media.view', icon: '🖼️', category: 'Contenido' },
  { label: 'Parámetros del Sitio', route: '/admin/site-params', permission: 'admin', icon: '⚙️', category: 'Sistema', iconClass: 'hover:rotate-90 transition-transform duration-500' },
] as const;

/**
 * Acciones de administración para Scope Asociación (WebScope.ASSOCIATION)
 */
export const ASSOCIATION_ADMIN_ACTIONS: ReadonlyArray<AdminAction> = [
  { label: 'Páginas', route: '/admin/pages/2', permission: 'pages.edit', icon: '📄', category: 'Contenido' },
  { label: 'Contactos', route: '/admin/asociacion/contactos', permission: 'admin', icon: '📞', category: 'Contenido' },
  { label: 'Miembros', route: '/admin/asociacion/membros', permission: 'admin', icon: '👥', category: 'Gestión' },
  { label: 'Estados de los socios', route: '/admin/asociacion/estados', permission: 'admin', icon: '⚙️', category: 'Gestión' , iconClass: 'hover:rotate-90 transition-transform duration-500' },
] as const;

/**
 * Acciones de administración para Scope Juego (WebScope.GAME)
 */
export const GAME_ADMIN_ACTIONS: ReadonlyArray<AdminAction> = [
  { label: 'Páginas', route: '/admin/pages/3', permission: 'pages.edit', icon: '📄', category: 'Contenido' }
] as const;

/**
 * Índice de acciones por scope para acceso rápido
 */
export const ADMIN_ACTIONS_BY_SCOPE: Record<number, ReadonlyArray<AdminAction>> = {
  [WebScope.GLOBAL]: GLOBAL_ADMIN_ACTIONS,
  [WebScope.ASSOCIATION]: ASSOCIATION_ADMIN_ACTIONS,
  [WebScope.GAME]: GAME_ADMIN_ACTIONS,
} as const;

/**
 * Obtiene las acciones autorizadas para un scope dado,
 * filtrando según los permisos del usuario.
 *
 * @param scope - El scope (WebScope.GLOBAL, WebScope.ASSOCIATION, o WebScope.GAME)
 * @param userPermissions - Array de permisos que tiene el usuario
 * @returns Array de acciones que el usuario puede ver
 */
export function getAuthorizedActions(
  scope: number,
  userPermissions: string[]
): AdminAction[] {
  const actions = ADMIN_ACTIONS_BY_SCOPE[scope] || [];
  return actions.filter(action => userPermissions.includes(action.permission));
}
