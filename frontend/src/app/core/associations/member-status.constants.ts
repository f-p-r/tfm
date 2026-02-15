/**
 * Tipos de estados de miembros de asociaciones
 */
export const MEMBER_STATUS_TYPES = {
  REQUEST: 1,        // Solicitud de ingreso
  ACTIVE: 2,         // Activo
  INCIDENTS: 3,      // Incidencias
  ALERT: 4,          // Alerta
  INACTIVE: 5        // Baja
} as const;

/**
 * Nombres de tipos de estados
 */
export const MEMBER_STATUS_TYPE_NAMES: Record<number, string> = {
  [MEMBER_STATUS_TYPES.REQUEST]: 'Solicitud de ingreso',
  [MEMBER_STATUS_TYPES.ACTIVE]: 'Activo',
  [MEMBER_STATUS_TYPES.INCIDENTS]: 'Incidencias',
  [MEMBER_STATUS_TYPES.ALERT]: 'Alerta',
  [MEMBER_STATUS_TYPES.INACTIVE]: 'Baja'
};

/**
 * Clases CSS para badges según tipo de estado
 */
export const MEMBER_STATUS_TYPE_BADGES: Record<number, string> = {
  [MEMBER_STATUS_TYPES.REQUEST]: 'ds-badge-request',      // Azul
  [MEMBER_STATUS_TYPES.ACTIVE]: 'ds-badge-active',        // Verde
  [MEMBER_STATUS_TYPES.INCIDENTS]: 'ds-badge-incident',   // Naranja
  [MEMBER_STATUS_TYPES.ALERT]: 'ds-badge-alert',          // Rojo
  [MEMBER_STATUS_TYPES.INACTIVE]: 'ds-badge-inactive'     // Gris (disabled)
};
