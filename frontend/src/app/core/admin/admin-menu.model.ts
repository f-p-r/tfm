/**
 * Define el modelo de datos para los ítems del menú lateral de administración.
 * Permite configurar la visualización (etiquetas, iconos), navegación (rutas)
 * y la lógica de acceso (permisos requeridos) para cada opción.
 */
export interface AdminMenuItem {
  label: string;
  icon: string;        // Emoji o clase de icono
  route?: string;      // Ruta de navegación (Angular Router)
  action?: () => void; // Acción alternativa al click (ej: logout)
  permission?: string; // Permiso requerido (ej: 'users.view'). Si es null/undefined, es público.
  category?: string;   // Nombre de la categoría para agrupar visualmente
  iconClass?: string;  // Clases CSS extra para el icono (ej: 'hover:rotate-90')
  /** Clave del pack de ayuda para mostrar tooltip al pasar el mouse */
  helpKey?: string;
}
