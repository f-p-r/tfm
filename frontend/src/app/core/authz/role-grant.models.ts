/**
 * Modelos para gestión de asignaciones de roles (role grants).
 */

export interface RoleGrant {
  id: number;
  user: {
    id: number;
    username: string;
    name: string;
  };
  role: {
    id: number;
    name: string;
  };
  scope_type: {
    value: number;
    name: string;
  };
  scope: {
    id: number;
    name: string;
  } | null;
  created_at: string;
  updated_at: string;
}

export interface RoleGrantCreateRequest {
  user_id: number;
  role_id: number;
  scope_type: number;
  scope_id: number | null;
}

export interface RoleGrantUpdateRequest {
  user_id?: number;
  role_id?: number;
  scope_type?: number;
  scope_id?: number | null;
}

/**
 * Constantes de roles disponibles en el sistema.
 */
export const ROLES = [
  { id: 1, name: 'admin' },
  { id: 3, name: 'editor' }
] as const;

/**
 * Constantes de tipos de scope.
 */
export const SCOPE_TYPES = [
  { id: 1, name: 'Global' },
  { id: 2, name: 'Asociación' },
  { id: 3, name: 'Juego' }
] as const;

/**
 * Opción especial para scope global (null).
 */
export const SCOPE_ALL_OPTION = { id: null, name: 'Todos' } as const;
