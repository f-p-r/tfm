// Configuración compartida de Quill para los prototipos
export const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, 4, false] }],
    ['bold', 'italic', 'underline'],
    [{ list: 'ordered' }, { list: 'bullet' }],
      [{ align: [] }],
      ['blockquote'],
    ['link'],
    ['clean'],
  ],
};

// Configuración del editor-demo con toolbar extendida para enlaces internos
export const editorDemoQuillModules = {
  toolbar: {
    container: [
      [{ header: [1, 2, 3, 4, false] }],
      ['bold', 'italic', 'underline'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ align: [] }],
      ['blockquote'],
      ['link'],
      ['internal-link'], // Botón personalizado para enlaces internos
      ['clean'],
    ],
    handlers: {
      // El handler se registrará dinámicamente en el componente
    },
  },
};
