import { Injectable } from '@angular/core';
import { Observable, of, delay, throwError } from 'rxjs';
import { PageDTO, PageSummaryDTO, PageCreateDTO, PageUpdateDTO, PageOwnerType } from '../../shared/content/page.dto';
import { WebScope } from '../web-scope.constants';

interface PageDBRecord {
  id: number;
  ownerType: string; // Stored as string in mock DB
  ownerId: number;
  title: string;
  slug: string;
  published: boolean;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  content: PageDTO['content'];
}

@Injectable({
  providedIn: 'root',
})
export class PagesService {
  private nextId = 5;

  // Mock database with ownerType as string (simulating backend storage)
  private mockPagesDB: PageDBRecord[] = [
    {
      id: 1,
      ownerType: '2', // Simulated backend value for ASSOCIATION
      ownerId: 1,
      title: 'Inicio',
      slug: 'inicio',
      published: true,
      publishedAt: new Date('2024-01-15'),
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-15'),
      content: {
        schemaVersion: 1,
        segments: [
          {
            id: 's1',
            type: 'rich',
            order: 1,
            textHtml:
              '<h1>Bienvenidos a la Asociación Española de Go</h1><p>La Asociación Española de Go (AEG) es una entidad sin ánimo de lucro que tiene como objetivo promover y difundir el juego del Go en España.</p>',
            image: {
              url: '/img/go-stones.jpg',
            },
            imagePlacement: 'left',
            imageWidth: 400,
          },
          {
            id: 's2',
            type: 'carousel',
            order: 2,
            height: 400,
            imagesPerView: 3,
            delaySeconds: 5,
            images: [
              {
                url: '/img/carousel1.jpg',
                alt: 'Imagen 1',
              },
              {
                url: '/img/carousel2.jpg',
                alt: 'Imagen 2',
              },
              {
                url: '/img/carousel3.jpg',
                alt: 'Imagen 3',
              },
            ],
          },
        ],
      },
    },
    {
      id: 2,
      ownerType: '2', // Simulated backend value for ASSOCIATION
      ownerId: 1,
      title: 'Actividades',
      slug: 'actividades',
      published: true,
      publishedAt: new Date('2024-02-01'),
      createdAt: new Date('2024-01-20'),
      updatedAt: new Date('2024-02-01'),
      content: {
        schemaVersion: 1,
        segments: [
          {
            id: 's3',
            type: 'rich',
            order: 1,
            textHtml:
              '<h1>Nuestras Actividades</h1><p>Organizamos torneos, cursos y eventos durante todo el año.</p>',
          },
        ],
      },
    },
    {
      id: 3,
      ownerType: '2', // Simulated backend value for ASSOCIATION
      ownerId: 1,
      title: 'Contacto',
      slug: 'contacto',
      published: false, // Draft page
      publishedAt: null,
      createdAt: new Date('2024-02-10'),
      updatedAt: new Date('2024-02-15'),
      content: {
        schemaVersion: 1,
        segments: [
          {
            id: 's4',
            type: 'rich',
            order: 1,
            textHtml:
              '<h1>Contacto</h1><p>Puedes contactarnos en info@aeg.es</p>',
          },
        ],
      },
    },
    {
      id: 4,
      ownerType: '2', // Simulated backend value for ASSOCIATION
      ownerId: 1,
      title: 'Noticias Borrador',
      slug: 'noticias-borrador',
      published: false, // Draft page
      publishedAt: null,
      createdAt: new Date('2024-03-01'),
      updatedAt: new Date('2024-03-01'),
      content: {
        schemaVersion: 1,
        segments: [
          {
            id: 's5',
            type: 'rich',
            order: 1,
            textHtml:
              '<h1>Noticias</h1><p>Este es un borrador de la página de noticias.</p>',
          },
        ],
      },
    },
  ];

  /**
   * Serialize PageOwnerType to string for mock DB storage
   */
  private serializeOwnerType(type: PageOwnerType): string {
    return type.toString();
  }

  /**
   * Deserialize string from mock DB to PageOwnerType
   */
  private deserializeOwnerType(type: string): PageOwnerType {
    const num = parseInt(type, 10);
    if (isNaN(num)) {
      return type as any; // Fallback for non-numeric strings
    }
    return num as PageOwnerType;
  }

  /**
   * Convert DB page to DTO with proper ownerType deserialization
   */
  private toDTO(dbPage: PageDBRecord): PageDTO {
    return {
      ...dbPage,
      ownerType: this.deserializeOwnerType(dbPage.ownerType),
      publishedAt: dbPage.publishedAt?.toISOString() ?? null,
      createdAt: dbPage.createdAt.toISOString(),
      updatedAt: dbPage.updatedAt.toISOString(),
    };
  }

  /**
   * List all pages for a given owner
   */
  listByOwner(
    ownerType: PageOwnerType,
    ownerId: number,
  ): Observable<PageSummaryDTO[]> {
    const serializedType = this.serializeOwnerType(ownerType);
    const pages = this.mockPagesDB
      .filter((p) => p.ownerType === serializedType && p.ownerId === ownerId)
      .map((p) => ({
        id: p.id,
        ownerType: this.deserializeOwnerType(p.ownerType),
        ownerId: p.ownerId,
        title: p.title,
        slug: p.slug,
        published: p.published,
        publishedAt: p.publishedAt?.toISOString() ?? null,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      }));

    return of(pages).pipe(delay(100));
  }

  /**
   * Get a page by ID
   */
  getById(id: number): Observable<PageDTO | null> {
    const dbPage = this.mockPagesDB.find((p) => p.id === id);
    if (!dbPage) {
      return of(null).pipe(delay(100));
    }
    return of(this.toDTO(dbPage)).pipe(delay(100));
  }

  /**
   * Get a page by owner and slug
   */
  getBySlug(
    ownerType: PageOwnerType,
    ownerId: number,
    slug: string,
  ): Observable<PageDTO | null> {
    const serializedType = this.serializeOwnerType(ownerType);
    const dbPage = this.mockPagesDB.find(
      (p) =>
        p.ownerType === serializedType &&
        p.ownerId === ownerId &&
        p.slug === slug,
    );

    if (!dbPage) {
      return of(null).pipe(delay(100));
    }

    return of(this.toDTO(dbPage)).pipe(delay(100));
  }

  /**
   * Create a new page
   */
  create(input: PageCreateDTO): Observable<PageDTO> {
    // Validate slug uniqueness
    const serializedType = this.serializeOwnerType(input.ownerType);
    const existingPage = this.mockPagesDB.find(
      (p) =>
        p.ownerType === serializedType &&
        p.ownerId === input.ownerId &&
        p.slug === input.slug,
    );

    if (existingPage) {
      return throwError(() => new Error('Ya existe una página con ese slug')).pipe(delay(100));
    }

    const now = new Date();
    const newDbPage: PageDBRecord = {
      id: this.nextId++,
      ownerType: serializedType,
      ownerId: input.ownerId,
      title: input.title,
      slug: input.slug,
      published: input.published ?? false,
      publishedAt: input.published ? now : null,
      createdAt: now,
      updatedAt: now,
      content: input.content ?? {
        schemaVersion: 1,
        segments: [],
      },
    };

    this.mockPagesDB.push(newDbPage);

    return of(this.toDTO(newDbPage)).pipe(delay(100));
  }

  /**
   * Update an existing page
   */
  update(id: number, patch: PageUpdateDTO): Observable<PageDTO> {
    const dbPage = this.mockPagesDB.find((p) => p.id === id);

    if (!dbPage) {
      return throwError(() => new Error('Página no encontrada')).pipe(delay(100));
    }

    // Validate slug uniqueness if changing slug
    if (patch.slug && patch.slug !== dbPage.slug) {
      const existingPage = this.mockPagesDB.find(
        (p) =>
          p.ownerType === dbPage.ownerType &&
          p.ownerId === dbPage.ownerId &&
          p.slug === patch.slug &&
          p.id !== id,
      );

      if (existingPage) {
        return throwError(() => new Error('Ya existe una página con ese slug')).pipe(delay(100));
      }
    }

    const now = new Date();

    // Apply updates
    if (patch.title !== undefined) dbPage.title = patch.title;
    if (patch.slug !== undefined) dbPage.slug = patch.slug;
    if (patch.content !== undefined) dbPage.content = patch.content;
    if (patch.published !== undefined) {
      dbPage.published = patch.published;
      // Set publishedAt when publishing for the first time
      if (patch.published && !dbPage.publishedAt) {
        dbPage.publishedAt = now;
      }
    }
    dbPage.updatedAt = now;

    return of(this.toDTO(dbPage)).pipe(delay(100));
  }
}
