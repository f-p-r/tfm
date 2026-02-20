/**
 * Modelo de datos para membresías de usuarios en asociaciones.
 */

export interface UserAssociation {
  id: number;
  user_id: number;
  association_id: number;
  association_user_id?: string; // Número de socio
  joined_at?: string; // Fecha de ingreso (YYYY-MM-DD)
  status_id?: number;
  created_at?: string;
  updated_at?: string;

  // Relaciones cargadas opcionalmente
  user?: {
    id: number;
    name: string;
    username: string;
    email: string;
  };

  association?: {
    id: number;
    name: string;
    slug: string;
    shortname?: string;
  };

  status?: {
    id: number;
    name: string;
    order: number;
    type: {
      id: number;
      name: string;
    };
  };
}
