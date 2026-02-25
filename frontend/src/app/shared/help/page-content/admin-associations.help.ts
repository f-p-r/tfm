/** Ayuda de página: gestión de asociaciones */
export const ADMIN_ASSOCIATIONS_PAGE_HELP = `
  <p>Gestión de asociaciones registradas en la plataforma. Permite crear,
  editar y deshabilitar asociaciones.</p>
  <ul class="list-disc pl-4 mt-2 space-y-1">
    <li>Cada asociación tiene un slug único que forma parte de su URL pública.</li>
    <li>Las asociaciones deshabilitadas no son visibles para los usuarios.</li>
  </ul>
`;

/** Ayuda de página: formulario crear/editar asociación */
export const ADMIN_ASSOCIATION_FORM_PAGE_HELP = `
  <p>Formulario para <strong>crear o editar una asociación</strong>. Los campos marcados con * son obligatorios.</p>
  <ul class="list-disc pl-4 mt-2 space-y-1">
    <li>El <strong>slug</strong> debe ser único y solo puede contener letras minúsculas, números y guiones.</li>
    <li>El <strong>nombre corto</strong> se usa en espacios reducidos (máx. 20 caracteres).</li>
    <li>Primero selecciona el <strong>país</strong> para poder elegir la región.</li>
    <li>Pasa el ratón sobre los campos o activa los iconos ⓘ para ver ayuda detallada.</li>
  </ul>
`;
