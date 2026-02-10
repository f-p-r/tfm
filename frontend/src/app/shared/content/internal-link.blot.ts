/*
import Quill from 'quill';

const Inline = Quill.import('blots/inline') as any;


 // Custom Blot para enlaces internos con tipo e identificador.
 // Renderiza un <a> con atributos href, data-internal-type y data-internal-id.
 // Soporta múltiples tipos: pages, news, events, games (3), associations (2).
 //
export class InternalLinkBlot extends Inline {
  static blotName = 'internal-link';
  static tagName = 'a';
  static className = 'internal-link';

  static create(value: { href: string; type: string | number; id: number }): HTMLElement {
    const node = super.create() as HTMLAnchorElement;
    node.setAttribute('href', value.href);
    node.setAttribute('data-internal-type', String(value.type));
    node.setAttribute('data-internal-id', String(value.id));
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer');
    return node;
  }

  static formats(node: HTMLElement): { href: string; type: string | number; id: number } | boolean {
    if (node.tagName !== 'A') return false;
    const href = node.getAttribute('href');
    const type = node.getAttribute('data-internal-type');
    const id = node.getAttribute('data-internal-id');
    if (!href || !type || !id) return false;

    // Convertir type a número si es numérico (para GAME=3, ASSOCIATION=2)
    const parsedType = /^\d+$/.test(type) ? Number(type) : type;

    return {
      href,
      type: parsedType,
      id: Number(id),
    };
  }

  format(name: string, value: { href: string; type: string | number; id: number } | boolean): void {
    if (name === 'internal-link' && value && typeof value === 'object') {
      this['domNode'].setAttribute('href', value.href);
      this['domNode'].setAttribute('data-internal-type', String(value.type));
      this['domNode'].setAttribute('data-internal-id', String(value.id));
    } else {
      super.format(name, value);
    }
  }

  formats(): Record<string, any> {
    const formats = super.formats();
    const href = this['domNode'].getAttribute('href');
    const type = this['domNode'].getAttribute('data-internal-type');
    const id = this['domNode'].getAttribute('data-internal-id');
    if (href && type && id) {
      const parsedType = /^\d+$/.test(type) ? Number(type) : type;
      formats['internal-link'] = { href, type: parsedType, id: Number(id) };
    }
    return formats;
  }
}
*/
