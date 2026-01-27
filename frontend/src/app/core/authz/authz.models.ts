/**
 * Tipos para consultas de autorización contra el backend.
 * POST /api/authz/query
 */

/**
 * Solicitud de consulta de permisos efectivos.
 */
export interface AuthzQueryRequest {
  /** Tipo de alcance: 1 (GLOBAL), 2 (ASSOCIATION), 3 (GAME) */
  scopeType: number;
  /** IDs de alcance específicos (ej: IDs de asociaciones o juegos). Puede estar vacío. */
  scopeIds: number[];
  /** Permisos a consultar (ej: ['news.create', 'news.edit']). Puede estar vacío. */
  permissions: string[];
  /** Si true, devuelve desglose por scopeId; si false, resumen agregado */
  breakdown: boolean;
}

/**
 * Respuesta cuando breakdown=false.
 * Indica si el usuario tiene TODOS los permisos en TODOS los scopeIds.
 */
export interface AuthzQuerySummaryResponse {
  scopeType: number;
  /** true si tiene todos los permisos solicitados en todos los scopeIds */
  all: boolean;
  /** scopeIds donde el usuario tiene al menos un permiso (puede ser vacío) */
  scopeIds: number[];
}

/**
 * Elemento de desglose: permisos efectivos por scopeId.
 */
export interface AuthzQueryBreakdownItem {
  scopeId: number;
  /** Permisos efectivos del usuario en este scopeId */
  permissions: string[];
}

/**
 * Respuesta cuando breakdown=true.
 * Incluye todos los permisos efectivos del usuario, desglosados por scopeId.
 */
export interface AuthzQueryBreakdownResponse {
  scopeType: number;
  /** true si tiene todos los permisos solicitados en todos los scopeIds */
  all: boolean;
  /** Unión de todos los permisos efectivos del usuario en ese scopeType */
  allPermissions: string[];
  /** Desglose de permisos por cada scopeId */
  results: AuthzQueryBreakdownItem[];
}

/**
 * Unión discriminada de respuestas: resumen o desglose.
 */
export type AuthzQueryResponse = AuthzQuerySummaryResponse | AuthzQueryBreakdownResponse;

/**
 * Type guard: verifica si la respuesta es un desglose (breakdown=true).
 */
export function isBreakdownResponse(res: AuthzQueryResponse): res is AuthzQueryBreakdownResponse {
  return 'allPermissions' in res && 'results' in res;
}

/**
 * Type guard: verifica si la respuesta es un resumen (breakdown=false).
 */
export function isSummaryResponse(res: AuthzQueryResponse): res is AuthzQuerySummaryResponse {
  return !('allPermissions' in res) && !('results' in res);
}
