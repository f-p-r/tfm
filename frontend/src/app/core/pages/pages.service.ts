import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { PageDTO, PageSummaryDTO, PageOwnerType } from '../../shared/content/page.dto';
import { PageContentDTO } from '../../shared/content/page-content.dto';
import { WebScope } from '../web-scope.constants';

/**
 * Servicio para gestión de páginas (mock).
 * Simula una API con datos en memoria.
 */
@Injectable({ providedIn: 'root' })
export class PagesService {
  private mockPages: PageDTO[] = [
    {
      id: 1,
      ownerType: WebScope.ASSOCIATION,
      ownerId: 2,
      slug: 'bienvenida',
      title: 'Bienvenida',
      published: true,
      publishedAt: '2026-01-15T10:00:00Z',
      content: {
        schemaVersion: 1,
        segments: [
          {
            id: 'seg-1',
            order: 1,
            type: 'rich',
            textHtml: `
              <h2>Bienvenidos a nuestra asociación</h2>
              <p>Esta es la página de inicio de nuestra comunidad. Aquí encontrarás toda la información relevante.</p>
              <p>Explora nuestras diferentes secciones y descubre todo lo que tenemos para ofrecer.</p>
            `,
            image: {
              url: 'https://picsum.photos/800/400',
              alt: 'Imagen de bienvenida',
            },
            imagePlacement: 'top',
          },
          {
            id: 'seg-2',
            order: 2,
            type: 'carousel',
            images: [
              { url: 'https://picsum.photos/800/300?random=1', alt: 'Evento 1' },
              { url: 'https://picsum.photos/800/300?random=2', alt: 'Evento 2' },
              { url: 'https://picsum.photos/800/300?random=3', alt: 'Evento 3' },
            ],
            height: 300,
            imagesPerView: 1,
            delaySeconds: 3,
          },
        ],
      },
      createdAt: '2026-01-10T12:00:00Z',
      updatedAt: '2026-01-15T10:00:00Z',
    },
    {
      id: 2,
      ownerType: WebScope.ASSOCIATION,
      ownerId: 2,
      slug: 'historia',
      title: 'Nuestra Historia',
     published: true,
      publishedAt: '2026-01-20T14:00:00Z',
      content: {
        schemaVersion: 1,
        segments: [
          {
            id: 'seg-1',
            order: 1,
            type: 'rich',
            textHtml: `
              <h2>Cómo empezó todo</h2>
              <p>Nuestra asociación nació en 2010 con la misión de reunir a entusiastas del gaming competitivo.</p>
              <p>A lo largo de los años hemos crecido hasta convertirnos en una de las comunidades más activas de España.</p>
              <p>Todo comenzó cuando un grupo de amigos decidió organizar el primer torneo local. Lo que empezó como un evento pequeño se convirtió rápidamente en una referencia del gaming competitivo.</p>
            `,
            image: {
              url: 'https://picsum.photos/500/600?random=4',
              alt: 'Foto histórica',
            },
            imagePlacement: 'left',
            imageWidth: 35,
          },
          {
            id: 'seg-2',
            order: 2,
            type: 'rich',
            textHtml: `
              <h3>Nuestros logros más destacados</h3>
              <ul>
                <li><strong>+500 miembros activos</strong> en toda España</li>
                <li><strong>20+ torneos anuales</strong> organizados desde 2015</li>
                <li><strong>Presencia internacional</strong> en 5 países europeos</li>
                <li><strong>3 equipos profesionales</strong> compitiendo a nivel nacional</li>
                <li><strong>Red de streamers</strong> con más de 100K seguidores combinados</li>
              </ul>
              <p class="mt-4">Nuestro compromiso con la comunidad sigue siendo el mismo: fomentar el fair play, la competitividad sana y el compañerismo.</p>
            `,
          },
          {
            id: 'seg-3',
            order: 3,
            type: 'rich',
            textHtml: `
              <h3>Cronología de hitos importantes</h3>
              <table class="w-full border-collapse">
                <tr><td class="font-bold p-2">2010</td><td class="p-2">Fundación de la asociación</td></tr>
                <tr><td class="font-bold p-2">2013</td><td class="p-2">Primer torneo internacional</td></tr>
                <tr><td class="font-bold p-2">2016</td><td class="p-2">Apertura de gaming house</td></tr>
                <tr><td class="font-bold p-2">2020</td><td class="p-2">Expansión a 5 países</td></tr>
                <tr><td class="font-bold p-2">2024</td><td class="p-2">500º miembro registrado</td></tr>
              </table>
            `,
          },
        ],
      },
      createdAt: '2026-01-18T09:00:00Z',
      updatedAt: '2026-01-20T14:00:00Z',
    },
    {
      id: 3,
      ownerType: WebScope.ASSOCIATION,
      ownerId: 2,
      slug: 'contacto',
      title: 'Contacto',
     published: true,
      publishedAt: '2026-01-22T16:00:00Z',
      content: {
        schemaVersion: 1,
        segments: [
          {
            id: 'seg-1',
            order: 1,
            type: 'rich',
            textHtml: `
              <h2>Ponte en contacto con nosotros</h2>
              <p>¿Tienes alguna pregunta? ¿Quieres unirte a nuestra comunidad? ¡Estamos aquí para ayudarte!</p>
            `,
          },
          {
            id: 'seg-2',
            order: 2,
            type: 'rich',
            textHtml: `
              <h3>Canales de comunicación</h3>
              <div class="space-y-3">
                <div class="bg-blue-50 p-4 rounded">
                  <strong class="text-blue-900">📧 Email:</strong>
                  <p class="text-blue-800">info@asociacion-gaming.com</p>
                </div>
                <div class="bg-purple-50 p-4 rounded">
                  <strong class="text-purple-900">💬 Discord:</strong>
                  <p class="text-purple-800">discord.gg/asociacion-gaming</p>
                </div>
                <div class="bg-sky-50 p-4 rounded">
                  <strong class="text-sky-900">🐦 Twitter:</strong>
                  <p class="text-sky-800">@AsociacionGaming</p>
                </div>
                <div class="bg-pink-50 p-4 rounded">
                  <strong class="text-pink-900">📸 Instagram:</strong>
                  <p class="text-pink-800">@asociacion.gaming</p>
                </div>
              </div>
            `,
            image: {
              url: 'https://picsum.photos/400/600?random=5',
              alt: 'Contacto',
            },
            imagePlacement: 'right',
            imageWidth: 30,
          },
          {
            id: 'seg-3',
            order: 3,
            type: 'rich',
            textHtml: `
              <h3>Horario de atención</h3>
              <p>Nuestro equipo está disponible para atenderte:</p>
              <ul>
                <li><strong>Lunes a Viernes:</strong> 10:00 - 20:00</li>
                <li><strong>Sábados:</strong> 12:00 - 18:00</li>
                <li><strong>Domingos:</strong> Cerrado</li>
              </ul>
              <p class="mt-4"><em>Responderemos a tu consulta en un plazo máximo de 24-48 horas.</em></p>
            `,
          },
        ],
      },
      createdAt: '2026-01-22T15:00:00Z',
      updatedAt: '2026-01-22T16:00:00Z',
    },
  ];

  /**
   * Lista páginas de un owner específico.
   *
   * @param ownerType Tipo de propietario ('association' | 'game')
   * @param ownerId ID del propietario
   * @returns Observable con array de resúmenes de páginas
   */
  listByOwner(ownerType: PageOwnerType, ownerId: number): Observable<PageSummaryDTO[]> {
    const filtered = this.mockPages
      .filter((p) => p.ownerType === ownerType && p.ownerId === ownerId)
      .map((p) => ({
        id: p.id,
        slug: p.slug,
        title: p.title,
        published: p.published,
        updatedAt: p.updatedAt,
        publishedAt: p.publishedAt,
      }));

    return of(filtered).pipe(delay(100)); // Simular latencia
  }

  /**
   * Obtiene una página por su ID.
   *
   * @param id ID de la página
   * @returns Observable con la página completa
   */
  getById(id: number): Observable<PageDTO | null> {
    const page = this.mockPages.find((p) => p.id === id);
    return of(page || null).pipe(delay(100));
  }

  /**
   * Guarda una página (crear o actualizar).
   * Mock: simplemente devuelve la página recibida.
   *
   * @param page Página a guardar
   * @returns Observable con la página guardada
   */
  save(page: PageDTO): Observable<PageDTO> {
    // Mock: simplemente devolver la página
    // En producción, aquí iría la llamada HTTP POST/PUT
    return of(page).pipe(delay(200));
  }
}
