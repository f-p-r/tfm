import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ContentRendererComponent } from '../../shared/content/content-renderer.component';
import { PageContentDTO } from '../../shared/content/page-content.dto';

const IMAGE_URL = 'https://lawebdeperez.es/frameworks_a3/img/landing1.jpg';

@Component({
  selector: 'app-content-segments-demo-page',
  standalone: true,
  imports: [ContentRendererComponent],
  template: `
    <main class="max-w-4xl mx-auto py-8 px-4">
      <header class="mb-8">
        <p class="text-xs uppercase tracking-widest text-gray-500">Prototipo</p>
        <h1 class="text-3xl font-semibold text-gray-900 mt-2">contentSegmentsDemo</h1>
        <p class="text-gray-600 mt-2">Render de segmentos sin editor ni guardado.</p>
      </header>

      <app-content-renderer [content]="content"></app-content-renderer>
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContentSegmentsDemoPage {
  readonly content: PageContentDTO = {
    schemaVersion: 1,
    segments: [
      {
        id: 'seg-1',
        order: 1,
        type: 'rich',
        textHtml: `
          <h2 class="text-2xl font-bold mb-3">Segmento 1: Imagen arriba</h2>
          <p class="text-gray-700">Este es un bloque con imagen en top.</p>
        `,
        image: { url: IMAGE_URL, alt: 'Imagen demo' },
        imagePlacement: 'top',
      },
      {
        id: 'seg-2',
        order: 2,
        type: 'carousel',
        images: [
          { url: IMAGE_URL, alt: 'Slide 1' },
          { url: IMAGE_URL, alt: 'Slide 2' },
          { url: IMAGE_URL, alt: 'Slide 3' },
        ],
        height: 300,
        imagesPerView: 3,
      },
      {
        id: 'seg-3',
        order: 3,
        type: 'rich',
        textHtml: `
          <h2 class="text-2xl font-bold mb-3">Segmento 3: Solo texto</h2>
          <p class="text-gray-700">Bloque de contenido sin imagen.</p>
        `,
      },
      {
        id: 'seg-4',
        order: 4,
        type: 'rich',
        textHtml: `
          <h2 class="text-2xl font-bold mb-3">Segmento 4: Imagen izquierda 50%</h2>
          <p class="text-gray-700">Este bloque demuestra la imagen colocada a la izquierda con un ancho del 50% y un texto lo suficientemente largo como para que fluya por debajo de la imagen. Cuando la pantalla es amplia, la imagen se mantiene a la izquierda y el texto ocupa el espacio restante, envolviéndola y continuando más allá de su altura.</p>
          <p class="text-gray-700">Para observar claramente el comportamiento, este párrafo añade más contenido. En dispositivos móviles, el diseño se apila de forma natural (la imagen primero y el texto debajo), mientras que en escritorio el texto rodea la imagen hasta superarla en altura, quedando todo el bloque limpio gracias al clearfix final. Esto permite composiciones ricas sin necesidad de maquetados complejos.</p>
          <p class="text-gray-700">Sigue leyendo: este es aún más texto de ejemplo que debería terminar bajando por debajo del final de la imagen, confirmando que el layout responde correctamente y que el texto no se corta ni solapa. Ideal para artículos con resúmenes ilustrados o secciones destacadas con fotografía.</p>
        `,
        image: { url: IMAGE_URL, alt: 'Imagen izquierda 50%' },
        imagePlacement: 'left',
        imageWidth: 50,
      },
      {
        id: 'seg-5',
        order: 5,
        type: 'rich',
        textHtml: `
          <h2 class="text-2xl font-bold mb-3">Segmento 5: Imagen derecha 50%</h2>
          <p class="text-gray-700">Ejemplo equivalente al anterior pero con la imagen a la derecha. En escritorio el texto envuelve la imagen y se extiende por debajo cuando es más largo. En móvil, la imagen ocupa el 100% del ancho y aparece por encima del texto.</p>
          <p class="text-gray-700">Añadimos suficiente texto de demostración para asegurar que el flujo pasa el borde inferior de la imagen: esto valida el float y el clearfix, evitando solapes y manteniendo una lectura cómoda en diferentes tamaños de pantalla.</p>
          <p class="text-gray-700">Más contenido de ejemplo: la composición resultante es útil para destacar imágenes relevantes mientras el texto se desarrolla en paralelo en dispositivos grandes, sin sacrificar la legibilidad en móviles.</p>
        `,
        image: { url: IMAGE_URL, alt: 'Imagen derecha 50%' },
        imagePlacement: 'right',
        imageWidth: 50,
      },
    ],
  };
}
