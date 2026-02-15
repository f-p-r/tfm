export type SegmentType = 'columns' | 'carousel';

export interface ColumnBlock {
  id: string;
  contentHtml: string; // HTML Puro (TinyMCE se encarga de todo)
}

export interface ColumnsSegmentDTO {
  id: string;
  order: number;
  type: 'columns';
  distribution: '1' | '1-1' | '2-1' | '1-2' | '3-1' | '1-3' | '1-1-1' | '1-2-1' | '2-1-1' | '1-1-2' | '1-1-1-1';
  columns: ColumnBlock[];
  verticalPadding?: 'none' | 'small' | 'normal' | 'large';
  backgroundColor?: 'transparent' | 'white' | 'neutral' | 'brand-light' | 'brand-dark' |
                    'brand-primary' | 'brand-secondary' | 'brand-accent' | 'danger' |
                    'brand-primary-light' | 'brand-secondary-light' | 'brand-accent-light' | 'danger-light' |
                    'neutral-dark' | 'neutral-medium' | 'neutral-light';
  textColor?: 'default' | 'white' | 'brand';
  containerWidth?: 'standard' | 'narrow' | 'full';
  fullWidthBackground?: boolean;
  anchorId?: string;
  classNames?: string;
}

export interface CarouselSegmentDTO {
  id: string;
  order: number;
  type: 'carousel';
  images: { mediaId: number; url: string; alt?: string }[];
  height: number;
  imagesPerView: number;
  delaySeconds: number;
  classNames?: string;
}

export type SegmentDTO = ColumnsSegmentDTO | CarouselSegmentDTO;

export interface PageContentDTO {
  schemaVersion: number;
  segments: SegmentDTO[];
  classNames?: string;
}
