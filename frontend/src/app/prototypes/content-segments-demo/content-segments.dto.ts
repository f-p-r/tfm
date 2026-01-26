// DTO: tipos para segmentos de contenido

export type SegmentDTO = RichSegmentDTO | CarouselSegmentDTO;

export interface ContentDTO {
  schemaVersion: 1;
  templateId: number;
  status: 'draft' | 'published';
  segments: SegmentDTO[];
}

export interface RichImageDTO {
  mediaId?: number;
  url: string;
  alt?: string;
}

export interface CarouselImageDTO {
  mediaId?: number;
  url: string;
  alt?: string;
}

export interface RichSegmentDTO {
  id: string;
  order: number;
  type: 'rich';
  textHtml?: string;
  image?: RichImageDTO;
  imagePlacement?: 'top' | 'left' | 'right';
  imageWidth?: number;
  imageMaxHeightPx?: number;
  // Campos heredados para compatibilidad con prototipos anteriores
  imageUrl?: string;
  imageMediaId?: number;
  imageAlt?: string;
}

export interface CarouselSegmentDTO {
  id: string;
  order: number;
  type: 'carousel';
  images: CarouselImageDTO[];
  height: number; // Altura obligatoria en px
  imagesPerView: number; // Número de imágenes visibles a la vez (1-6)
  delaySeconds?: number; // Retardo en segundos para autoavanzar (0 o undefined = sin auto)
}
