/**
 * Modelos de dominio para juegos.
 */

/**
 * Juego disponible en la plataforma.
 */
export interface Game {
  /** ID único del juego */
  id: number;
  /** Nombre del juego (único) */
  name: string;
  /** Slug para URLs (único, max 64 caracteres) */
  slug: string;
  /** Número de jugadores por equipo */
  team_size: number;
  /** Si el juego está deshabilitado (no visible para usuarios) */
  disabled: boolean;
  /** Fecha de creación (ISO 8601) */
  created_at: string;
  /** Fecha de última actualización (ISO 8601) */
  updated_at: string;
}
