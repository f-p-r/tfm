// DTO: tipos para segmentos de contenido

export type SegmentDTO = RichSegmentDTO | CarouselSegmentDTO;

export interface ContentDTO {
  schemaVersion: 1;
  templateId: number;
  status: 'draft' | 'published';
  segments: SegmentDTO[];
}

export interface RichSegmentDTO {
  id: string;
  order: number;
  type: 'rich';
  textHtml?: string;
  imageUrl?: string;
  imageMediaId?: number;
  imageAlt?: string;
  imagePlacement?: 'top' | 'left' | 'right';
  imageWidth?: number; // porcentaje (25, 33, 50, 66, 75, 100)
  imageMaxHeightPx?: number; // altura máxima opcional para la imagen
}

export interface CarouselSegmentDTO {
  id: string;
  order: number;
  type: 'carousel';
  images: { url: string; alt?: string }[];
  maxHeightPx?: number; // altura máxima opcional para las imágenes
}
