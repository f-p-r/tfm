/**
 * Modelo de datos para Asociaciones.
 */

export interface Association {
  id: number;
  name: string;
  shortname?: string;
  slug: string;
  description?: string;
  country_id?: string;
  region_id?: string;
  web?: string;
  disabled: boolean;
  games?: Array<{
    id: number;
    name: string;
    slug: string;
    disabled: boolean;
    team_size?: number;
  }>;
  country?: {
    id: string;
    name: string;
  };
  region?: {
    id: string;
    name: string;
  };
  created_at?: string;
  updated_at?: string;
}
