/**
 * Modelo de datos para Asociaciones.
 */

export interface Association {
  id: number;
  name: string;
  slug: string;
  disabled: boolean;
  games?: Array<{
    id: number;
    name: string;
    slug: string;
    disabled: boolean;
    team_size?: number;
  }>;
  created_at?: string;
  updated_at?: string;
}
