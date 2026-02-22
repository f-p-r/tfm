/**
 * Configuración de una columna para la tabla de administración.
 */
export interface AdminTableColumn {
  /** Clave de la propiedad en el objeto de datos (ej: 'email', 'status') */
  key: string;

  /** Texto a mostrar en la cabecera (th) */
  label: string;

  /** Tipo de renderizado */
  type?: 'text' | 'date' | 'badge' | 'link' | 'actions' | 'select';

  /** * Solo para type='link'. Prefijo para el href (ej: 'mailto:', 'tel:', 'https://').
   * Si no se especifica, se asume que el valor ya contiene el prefijo.
   */
  linkPrefix?: string;

  /** * Solo para type='badge'. Mapa de valor -> clase CSS.
   * Ej: { 'active': 'ds-badge-active', 'pending': 'ds-badge-request' }
   */
  badgeConfig?: Record<string, string>;

  /** * Solo para type='badge'. Mapa de valor -> Texto a mostrar (opcional).
   * Si no se define, muestra el valor tal cual.
   */
  badgeLabels?: Record<string, string>;

  /** Alineación del texto */
  align?: 'left' | 'center' | 'right';

  /** Ancho específico (clase Tailwind, ej: 'w-20') */
  width?: string;

  /**
   * Solo para type='select'. Array de opciones del desplegable.
   * Ej: [{ value: 1, label: 'Pendiente' }, { value: 2, label: 'Admitido' }]
   */
  selectOptions?: { value: any; label: string }[];
}

/**
 * Definición de una acción (botón) dentro de una fila.
 */
export interface AdminTableAction {
  label: string;
  /** Identificador de la acción (ej: 'edit', 'delete') */
  action: string;
  /** Clase CSS para el botón (ej: 'text-brand-primary') */
  class?: string;
  /** Función que recibe la fila y devuelve true si el botón debe estar deshabilitado */
  disabledWhen?: (row: any) => boolean;
}
