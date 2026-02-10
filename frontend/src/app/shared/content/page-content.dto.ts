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
  backgroundColor?: 'white' | 'neutral' | 'brand-light' | 'brand-dark';
  textColor?: 'default' | 'white' | 'brand';
  containerWidth?: 'standard' | 'narrow' | 'full';
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
