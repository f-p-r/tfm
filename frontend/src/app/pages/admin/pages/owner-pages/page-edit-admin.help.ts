import { HelpPack } from '../../../../shared/help/help.types';

export const PAGE_EDIT_ADMIN_HELP: HelpPack = {
  items: {
    'page_title': {
      title: 'Título de la Página',
      text: 'El título principal de la página. Se mostrará en el navegador y en los resultados de búsqueda.'
    },
    'page_slug': {
      title: 'Slug (URL)',
      text: 'Identificador único para la URL de la página. Usa solo letras minúsculas, números y guiones. Debe ser único dentro del propietario (owner).'
    },
    'page_published': {
      title: 'Estado de Publicación',
      text: 'Marca esta casilla para hacer visible la página públicamente. Si está desmarcada, la página permanecerá como borrador privado.'
    },
    'page_classnames': {
      title: 'Clases CSS',
      text: '(Avanzado) Añade clases CSS personalizadas del Design System (prefijo ds-) separadas por espacios para personalizar el aspecto de la página.'
    }
  }
};
