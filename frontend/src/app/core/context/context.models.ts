/**
 * Interfaz que debe implementar cualquier entidad (Noticia, Página, Evento, etc.)
 * devuelta por un Resolver para que el sistema de contexto administrativo la reconozca.
 *
 * Permite al ContextService identificar quién es el propietario del dato
 * para verificar permisos automáticamente.
 */
export interface OwnableEntity {
  /** ID único de la entidad (ej: id de la noticia) */
  id: number;

  /**
   * Tipo de propietario según la constante WebScope.
   * 1 = GLOBAL, 2 = ASSOCIATION, 3 = GAME
   */
  ownerType: number;

  /**
   * ID del propietario.
   * Ej: ID de la Asociación o del Juego.
   * Si es scope GLOBAL, este valor suele ignorarse o ser 0.
   */
  ownerId: number;
}

/**
 * Configuración para el botón de acción administrativa en la barra de navegación.
 * El ContextService emite objetos de este tipo para que el Navbar se actualice.
 */
export interface AdminAction {
  /** Texto a mostrar en el botón (ej: "Editar Página", "Administración") */
  label: string;

  /**
   * Array de comandos de navegación para el routerLink.
   * Ej: ['/admin', 'pages', 1, 'edit', 5]
   */
  route: any[];

  /**
   * Determina si el botón debe ser visible.
   * Útil para ocultar el botón si el usuario no tiene permisos,
   * aunque se haya calculado una ruta potencial.
   */
  isVisible: boolean;
}
