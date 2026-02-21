/**
 * Constantes de permisos del sistema.
 *
 * Usar siempre estas constantes en lugar de strings literales para evitar
 * errores tipográficos y facilitar refactorizaciones.
 *
 * @example
 * ```typescript
 * import { PERM } from '../core/authz/permissions.constants';
 *
 * requirePermission(PERM.PAGES_EDIT)
 * permissionsStore.hasPermission(PERM.NEWS_EDIT)
 * ```
 */
export const PERM = {
  /** Permiso de superadministrador global */
  ADMIN: 'admin',

  /** Edición de páginas de contenido (global, asociación y juego) */
  PAGES_EDIT: 'pages.edit',

  /** Creación y edición de noticias (global, asociación y juego) */
  NEWS_EDIT: 'news.edit',

  /** Creación y edición de eventos (global, asociación y juego) */
  EVENTS_EDIT: 'events.edit',

  /** Visualización de medios globales */
  GLOBAL_MEDIA_VIEW: 'global.media.view',
} as const;

export type PermissionKey = typeof PERM[keyof typeof PERM];
