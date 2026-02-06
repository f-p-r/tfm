// Configuración compartida de Quill para los prototipos
import Quill from 'quill';
import QuillTableBetter from 'quill-table-better';
import es_ES from './quill-table-better-es';

// Registrar QuillTableBetter globalmente para los prototipos
Quill.register('modules/table-better', QuillTableBetter);

export const createQuillModules = (handlers: Record<string, () => void>) => ({
  toolbar: {
    container: [
      [{ header: [1, 2, 3, 4, false] }],
      ['bold', 'italic', 'underline'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ align: [] }],
      ['blockquote'],
      ['link'],
      ['internal-link'],
      ['table-better'],
      ['clean'],
    ],
    handlers,
  },
  'table-better': {
    toolbarTable: true,
    language: { name: 'es_ES', content: es_ES },
    menus: ['column', 'row', 'merge', 'table', 'cell', 'wrap', 'delete'],
  },
  keyboard: {
    bindings: QuillTableBetter.keyboardBindings
  }
});
