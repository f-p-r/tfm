/**
 * Módulo de gestión de contenido interno.
 * Exporta componentes y servicios para trabajar con enlaces internos en editores Quill.
 */

// Blot personalizado para enlaces internos
//export { InternalLinkBlot } from './internal-link.blot';

// Componente selector de enlaces internos
export { LinkSelectorComponent, type InternalLinkDestination } from './link-selector.component';

// Servicio API para resolver enlaces
export { InternalLinksApiService, type InternalLinkResolution } from './internal-links-api.service';

// Servicio para reescribir enlaces antes de renderizar
export { InternalLinksRewriterService, type BuildUrlFn } from './internal-links-rewriter.service';
