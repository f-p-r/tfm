/**
 * Tipo string para los scopes de la aplicación.
 */
export type WebScopeType = 'global' | 'association' | 'game';

/**
 * Valores numéricos para los scopes (alcances) de la aplicación.
 * Usable en permisos, validaciones, y comunicación con backend.
 */
export enum WebScope {
  GLOBAL = 1,
  ASSOCIATION = 2,
  GAME = 3,
}

/**
 * Mapeo de string a número para convertir WebScopeType a valor numérico.
 */
export const WEB_SCOPE_VALUE: Record<WebScopeType, number> = {
  'global': WebScope.GLOBAL,
  'association': WebScope.ASSOCIATION,
  'game': WebScope.GAME,
};

/**
 * Mapeo inverso: de número a string.
 */
export const WEB_SCOPE_NAME: Record<number, WebScopeType | undefined> = {
  [WebScope.GLOBAL]: 'global',
  [WebScope.ASSOCIATION]: 'association',
  [WebScope.GAME]: 'game',
};
