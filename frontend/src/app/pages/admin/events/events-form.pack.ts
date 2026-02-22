import { HelpPack } from '../../../shared/help/help.types';

/**
 * Pack de ayuda para el formulario de creación y edición de eventos.
 */
export const EVENTS_FORM_PACK: HelpPack = {
  screen: {
    title: 'Gestión de evento',
    intro: 'Formulario para crear o editar un evento. El título, el slug, el texto introductorio y la fecha de inicio son obligatorios.',
    sections: [
      {
        title: 'Campos obligatorios',
        items: [
          'Título: nombre visible del evento.',
          'Slug: fragmento de URL único que identifica el evento.',
          'Texto introductorio: resumen breve para listados y tarjetas.',
          'Fecha de inicio: cuándo comienza el evento.',
        ],
      },
      {
        title: 'Estado del evento',
        items: [
          '"Publicado": el evento es visible para todos los usuarios.',
          '"Activo": el evento está habilitado. Desmarca para cerrarlo sin eliminar.',
          '"Inscripción abierta": los usuarios pueden solicitar asistencia.',
        ],
      },
      {
        title: 'Lugar',
        items: [
          'Todos los campos de dirección son opcionales.',
          'Al seleccionar país, el selector de región se filtra automáticamente.',
        ],
      },
      {
        title: 'Contenido enriquecido',
        items: [
          'El contenido segmentado es opcional.',
          'Si se añaden segmentos, se mostrarán en la página de detalle del evento.',
        ],
      },
    ],
  },
  items: {
    title: {
      title: 'Título',
      text: 'Nombre visible del evento. Aparece en listados y en la cabecera del detalle. Máximo 255 caracteres.',
    },
    slug: {
      title: 'Slug (URL)',
      text: 'Identificador del evento en la URL. Solo letras minúsculas, números y guiones. Ejemplo: torneo-primavera-2026.',
    },
    text: {
      title: 'Texto introductorio',
      text: 'Descripción breve del evento. Se muestra en tarjetas y listados. Es obligatorio.',
    },
    published: {
      title: 'Publicar evento',
      text: 'Si está marcado, el evento será visible para todos los usuarios. Sin marcar, permanece como borrador privado.',
    },
    active: {
      title: 'Activo',
      text: 'Indica si el evento está habilitado. Puedes desactivarlo para cerrarlo sin eliminarlo.',
    },
    registrationOpen: {
      title: 'Inscripción abierta',
      text: 'Cuando está marcado, los usuarios autenticados pueden solicitar asistencia al evento.',
    },
    gameId: {
      title: 'Juego relacionado',
      text: 'Juego de la asociación al que está vinculado este evento. Opcional.',
    },
    startsAt: {
      title: 'Fecha de inicio',
      text: 'Fecha y hora en que comienza el evento. Campo obligatorio.',
    },
    endsAt: {
      title: 'Fecha de fin',
      text: 'Fecha y hora en que termina el evento. Opcional. Debe ser posterior a la fecha de inicio.',
    },
    countryCode: {
      title: 'País',
      text: 'País donde se celebra el evento. Al seleccionarlo, la lista de regiones se filtra automáticamente.',
    },
    regionId: {
      title: 'Región / Comunidad autónoma',
      text: 'Región o comunidad autónoma. Se filtra según el país seleccionado.',
    },
    provinceName: {
      title: 'Provincia',
      text: 'Nombre de la provincia o área geográfica.',
    },
    municipalityName: {
      title: 'Municipio',
      text: 'Nombre del municipio o localidad donde se celebra.',
    },
    postalCode: {
      title: 'Código postal',
      text: 'Código postal de 5 dígitos.',
    },
    streetName: {
      title: 'Calle / Vía',
      text: 'Nombre de la vía o dirección del lugar.',
    },
    streetNumber: {
      title: 'Número',
      text: 'Número de la vía. Admite formatos como 3-B, 12 bis.',
    },
    classNames: {
      title: 'Clases CSS del contenido',
      text: 'Clases CSS aplicadas al contenedor del contenido enriquecido. Uso avanzado.',
    },
  },
};
