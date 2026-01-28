import Quill from 'quill';

const Inline = Quill.import('blots/inline') as any;

/**
 * Custom Blot para enlaces internos con identificador de página.
 * Renderiza un <a> con atributos href y data-page-id.
 */
export class InternalLinkBlot extends Inline {
  static blotName = 'internal-link';
  static tagName = 'a';
  static className = 'internal-link';

  static create(value: { href: string; pageId: string; label?: string }): HTMLElement {
    const node = super.create() as HTMLAnchorElement;
    node.setAttribute('href', value.href);
    node.setAttribute('data-page-id', value.pageId);
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer');
    return node;
  }

  static formats(node: HTMLElement): { href: string; pageId: string } | boolean {
    if (node.tagName !== 'A') return false;
    const href = node.getAttribute('href');
    const pageId = node.getAttribute('data-page-id');
    if (!href || !pageId) return false;
    return {
      href,
      pageId,
    };
  }

  format(name: string, value: { href: string; pageId: string } | boolean): void {
    if (name === 'internal-link' && value && typeof value === 'object') {
      this['domNode'].setAttribute('href', value.href);
      this['domNode'].setAttribute('data-page-id', value.pageId);
    } else {
      super.format(name, value);
    }
  }

  formats(): Record<string, any> {
    const formats = super.formats();
    const href = this['domNode'].getAttribute('href');
    const pageId = this['domNode'].getAttribute('data-page-id');
    if (href && pageId) {
      formats['internal-link'] = { href, pageId };
    }
    return formats;
  }
}
