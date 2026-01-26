import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { input, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MediaApiService } from './media-api.service';
import { MediaItem, MediaScopeType } from './media.models';

@Component({
  selector: 'app-media-picker',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 z-40 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" (click)="onClose()"></div>

      <div class="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col gap-4 p-4" (click)="$event.stopPropagation()">
        <div class="flex items-center justify-between gap-3">
          <h3 class="text-lg font-semibold text-neutral-800">Seleccionar imagen</h3>
          <div class="flex items-center gap-2 flex-wrap justify-end">
            @if (allowUpload()) {
              @if (uploading()) {
                <span class="text-sm text-neutral-600">Subiendo...</span>
              }
              <button
                type="button"
                class="ds-btn ds-btn-secondary"
                (click)="openFilePicker(fileInput)"
                [disabled]="uploading()"
              >
                Subir imagen
              </button>
              <input #fileInput type="file" accept="image/*" class="hidden" (change)="onFileSelected($event, fileInput)" />
            }
            <button type="button" class="ds-btn ds-btn-secondary" (click)="onClose()">Cerrar</button>
          </div>
        </div>

        @if (errorMessage()) {
          <div class="text-sm text-red-600">{{ errorMessage() }}</div>
        }

        @if (loading()) {
          <div class="text-sm text-neutral-700">Cargando imagenes...</div>
        } @else {
          <div class="grid grid-cols-2 md:grid-cols-6 gap-3">
            @for (item of items(); track item.id) {
              <button
                type="button"
                class="ds-btn-img-grid"
                (click)="openImageModal(item)"
              >
                <img [src]="item.url" alt="" class="w-full h-28 object-cover" />
                <div class="p-2 text-xs text-neutral-700 truncate">{{ fileName(item.url) }}</div>
              </button>
            }
          </div>
          @if (!items().length && !errorMessage()) {
            <div class="text-sm text-neutral-700">No hay imágenes disponibles.</div>
          }
        }

        @if (modalItem()) {
          <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" (click)="closeImageModal()"></div>
            <div class="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col gap-4 p-4">
              <div class="flex-1 flex items-center justify-center overflow-auto">
                <img [src]="modalItem()?.url" alt="" class="max-h-[70vh] max-w-full object-contain" />
              </div>
              <div class="flex items-center justify-center gap-16 pb-2">
                <button type="button" class="ds-btn ds-btn-primary" (click)="confirmPick(modalItem()!)">Seleccionar</button>
                <button type="button" class="ds-btn ds-btn-secondary" (click)="closeImageModal()">Cancelar</button>
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MediaPickerComponent {
  private readonly mediaApi = inject(MediaApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly scopeType = input<MediaScopeType>();
  readonly scopeId = input<number | null>(null);
  readonly includeGlobal = input(true);
  readonly pageSize = input(60);
  readonly allowUpload = input(true);
  readonly mode = input<'single' | 'multi'>('single');

  readonly close = output<void>();

  readonly pick = output<MediaItem>();
  readonly uploadSuccess = output<MediaItem>();
  readonly error = output<string>();

  readonly items = signal<MediaItem[]>([]);
  readonly loading = signal(false);
  readonly uploading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly modalItem = signal<MediaItem | null>(null);

  constructor() {
    effect(() => {
      const scopeType = this.scopeType();
      const scopeId = this.scopeId();
      const includeGlobal = this.includeGlobal();
      const pageSize = this.pageSize();

      if (!scopeType) return;
      if (scopeType !== 'global' && (scopeId === null || scopeId === undefined)) return;

      this.loadMedia(scopeType, scopeId ?? null, includeGlobal, pageSize);
    });
  }

  openFilePicker(el: HTMLInputElement): void {
    el.click();
  }

  onFileSelected(event: Event, inputEl: HTMLInputElement): void {
    const file = (event.target as HTMLInputElement | null)?.files?.[0];
    if (!file) return;
    this.uploadFile(file);
    inputEl.value = '';
  }

  emitPick(item: MediaItem): void {
    this.pick.emit(item);
  }

  openImageModal(item: MediaItem): void {
    this.modalItem.set(item);
  }

  closeImageModal(): void {
    this.modalItem.set(null);
  }

  confirmPick(item: MediaItem): void {
    this.pick.emit(item);
    this.closeImageModal();
    this.onClose();
  }

  onClose(): void {
    this.closeImageModal();
    this.close.emit();
  }

  private loadMedia(scopeType: MediaScopeType, scopeId: number | null, includeGlobal: boolean | null, pageSize: number | null): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.mediaApi
      .listMedia({ scopeType, scopeId, includeGlobal: includeGlobal ?? true, page: 1, pageSize: pageSize ?? 60 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.items.set(res.items ?? []);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.errorMessage.set('No se pudieron cargar imagenes');
          this.error.emit('No se pudieron cargar imagenes');
        },
      });
  }

  private uploadFile(file: File): void {
    const scopeType = this.scopeType();
    const scopeId = this.scopeId();
    if (!scopeType) return;
    if (scopeType !== 'global' && (scopeId === null || scopeId === undefined)) {
      this.errorMessage.set('Falta scopeId para subir la imagen');
      this.error.emit('Falta scopeId para subir la imagen');
      return;
    }

    this.uploading.set(true);
    this.errorMessage.set(null);

    this.mediaApi
      .uploadMedia(file, scopeType, scopeId ?? null)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (item) => {
          this.uploadSuccess.emit(item);
          this.pick.emit(item);
          this.refreshAfterUpload(item);
          this.uploading.set(false);
        },
        error: () => {
          this.uploading.set(false);
          this.errorMessage.set('No se pudo subir la imagen');
          this.error.emit('No se pudo subir la imagen');
        },
      });
  }

  private refreshAfterUpload(newItem: MediaItem): void {
    // Prepend the new item for feedback, then refresh to keep list aligned with backend order
    this.items.set([newItem, ...this.items()]);
    const scopeType = this.scopeType();
    if (!scopeType) return;
    const scopeId = this.scopeId();
    this.loadMedia(scopeType, scopeId ?? null, this.includeGlobal(), this.pageSize());
  }

  fileName(url: string): string {
    if (!url) return '';
    try {
      const parts = url.split('?')[0].split('/');
      return parts[parts.length - 1] || url;
    } catch {
      return url;
    }
  }
}
