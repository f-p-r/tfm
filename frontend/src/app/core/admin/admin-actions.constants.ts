/**
 * Definición de acciones disponibles en el menú de administración
 * organizadas por scope (Global, Asociación, Juego).
 */

import { WebScope } from '../web-scope.constants';
import { PERM } from '../authz/permissions.constants';

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
  { label: 'Páginas', route: '/admin/pages/1', permission: PERM.PAGES_EDIT, icon: 'description', category: 'Contenido' },
  { label: 'Noticias', route: '/admin/noticias', permission: PERM.NEWS_EDIT, icon: 'article', category: 'Contenido' },
  { label: 'Eventos', route: '/admin/eventos', permission: PERM.EVENTS_EDIT, icon: 'event', category: 'Contenido' },
  { label: 'Contactos', route: '/admin/contactos', permission: PERM.ADMIN, icon: 'call', category: 'Contenido' },
  { label: 'Asociaciones', route: '/admin/asociaciones', permission: PERM.ADMIN, icon: 'account_balance', category: 'Gestión' },
  { label: 'Juegos', route: '/admin/juegos', permission: PERM.ADMIN, icon: 'casino', category: 'Gestión' },
  { label: 'Usuarios', route: '/admin/usuarios', permission: PERM.ADMIN, icon: 'group', category: 'Gestión' },
  { label: 'Medios', route: '/admin/media', permission: PERM.GLOBAL_MEDIA_VIEW, icon: 'photo_library', category: 'Contenido' }
] as const;

/**
 * Acciones de administración para Scope Asociación (WebScope.ASSOCIATION)
 */
export const ASSOCIATION_ADMIN_ACTIONS: ReadonlyArray<AdminAction> = [
  { label: 'Juegos relacionados', route: '/admin/asociacion/juegos_relacionados', permission: PERM.ADMIN, icon: 'casino', category: 'Gestión' },
  { label: 'Páginas', route: '/admin/pages/2', permission: PERM.PAGES_EDIT, icon: 'description', category: 'Contenido' },
  { label: 'Noticias', route: '/admin/asociacion/noticias', permission: PERM.NEWS_EDIT, icon: 'article', category: 'Contenido' },
  { label: 'Eventos', route: '/admin/asociacion/eventos', permission: PERM.EVENTS_EDIT, icon: 'event', category: 'Contenido' },
  { label: 'Contactos', route: '/admin/asociacion/contactos', permission: PERM.ADMIN, icon: 'call', category: 'Contenido' },
  { label: 'Miembros', route: '/admin/asociacion/miembros', permission: PERM.ADMIN, icon: 'group', category: 'Gestión' },
  { label: 'Estados de los miembros', route: '/admin/asociacion/estados', permission: PERM.ADMIN, icon: 'settings', category: 'Gestión' , iconClass: 'hover:rotate-90 transition-transform duration-500' },
] as const;

/**
 * Acciones de administración para Scope Juego (WebScope.GAME)
 */
export const GAME_ADMIN_ACTIONS: ReadonlyArray<AdminAction> = [
  { label: 'Páginas', route: '/admin/pages/3', permission: PERM.PAGES_EDIT, icon: 'description', category: 'Contenido' },
  { label: 'Noticias', route: '/admin/juego/noticias', permission: PERM.NEWS_EDIT, icon: 'article', category: 'Contenido' },
  { label: 'Eventos', route: '/admin/juego/eventos', permission: PERM.EVENTS_EDIT, icon: 'event', category: 'Contenido' },
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
