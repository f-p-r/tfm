import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, signal, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MediaApiService } from './media-api.service';
import { MediaItem, MediaListResponse } from './media.models';
import { WebScope } from '../../core/web-scope.constants';

@Component({
  selector: 'app-media-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 z-40 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" (click)="onClose()"></div>

      <div class="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col gap-4 p-4" (click)="$event.stopPropagation()">
        <div class="flex items-center justify-between gap-3">
          <h3 class="text-lg font-semibold text-neutral-800">Seleccionar imagen</h3>
          <div class="flex items-center gap-2 flex-wrap justify-end">
            @if (allowUpload()) {
              <button type="button" class="ds-btn ds-btn-secondary text-sm" (click)="fileInput.click()" [disabled]="uploading()">
                {{ uploading() ? 'Subiendo...' : 'Subir nueva' }}
              </button>
              <input #fileInput type="file" class="hidden" accept="image/*" (change)="onFileSelected($event)" />
            }
            <button type="button" class="p-2 hover:bg-neutral-100 rounded-full transition-colors" (click)="onClose()">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
        </div>

        @if (infoMessage()) {
          <div class="text-xs text-blue-600 bg-blue-50 p-2 rounded-lg border border-blue-100">{{ infoMessage() }}</div>
        }

        <div class="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 p-1">
           @for (item of items(); track item.id) {
             <div
               class="group relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all"
               [class.border-brand-primary]="modalItem()?.id === item.id"
               [class.border-transparent]="modalItem()?.id !== item.id"
               (click)="modalItem.set(item)"
             >
               <img [src]="item.url" class="w-full h-full object-cover" loading="lazy" />
             </div>
           }
        </div>

        @if (modalItem()) {
          <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div class="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
            <div class="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 flex flex-col gap-4">

              <div class="flex-1 flex items-center justify-center bg-gray-50 rounded-lg p-4 overflow-hidden">
                <img [src]="modalItem()?.url" [style.width.%]="showDesignControls() ? imgWidth() : ''" class="max-h-[40vh] object-contain shadow-sm transition-all" />
              </div>

              @if (showDesignControls()) {
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div class="flex flex-col gap-2">
                    <label class="text-xs font-bold text-gray-500 uppercase">Ancho: {{ imgWidth() }}%</label>
                    <input type="range" min="10" max="100" step="5" [(ngModel)]="imgWidth" class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-primary">
                  </div>
                  <div class="flex flex-col gap-2">
                    <label class="text-xs font-bold text-gray-500 uppercase">Alineación</label>
                    <div class="flex gap-2">
                      <button type="button" (click)="imgFloat.set('none')" [class.bg-brand-primary]="imgFloat() === 'none'" [class.text-white]="imgFloat() === 'none'" class="flex-1 py-1 border rounded text-xs">Centro</button>
                      <button type="button" (click)="imgFloat.set('left')" [class.bg-brand-primary]="imgFloat() === 'left'" [class.text-white]="imgFloat() === 'left'" class="flex-1 py-1 border rounded text-xs">Izquierda</button>
                      <button type="button" (click)="imgFloat.set('right')" [class.bg-brand-primary]="imgFloat() === 'right'" [class.text-white]="imgFloat() === 'right'" class="flex-1 py-1 border rounded text-xs">Derecha</button>
                    </div>
                  </div>
                </div>
              }

              <div class="flex gap-3 justify-center">
                <button type="button" class="ds-btn ds-btn-primary px-8" (click)="confirmSelection(modalItem()!)">Insertar</button>
                <button type="button" class="ds-btn ds-btn-secondary" (click)="modalItem.set(null)">Cancelar</button>
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

  // Inputs restaurados y nuevos
  readonly scopeType = input<number>();
  readonly scopeId = input<number | null>(null);
  readonly includeGlobal = input(true);
  readonly infoMessage = input<string | null>(null);
  readonly mode = input<'single' | 'multi'>('single');
  readonly showDesignControls = input(false);

  // Outputs tipados explícitamente para evitar errores TS2345
  readonly pick = output<MediaItem>();
  readonly pickWithDesign = output<{ item: MediaItem, width: string, float: string }>();
  readonly uploadSuccess = output<MediaItem>();
  readonly error = output<string>();
  readonly close = output<void>();

  readonly items = signal<MediaItem[]>([]);
  readonly loading = signal(false);
  readonly uploading = signal(false);
  readonly modalItem = signal<MediaItem | null>(null);

  readonly imgWidth = signal(50);
  readonly imgFloat = signal<'none' | 'left' | 'right'>('none');

  readonly allowUpload = computed(() => !!this.scopeType());

  constructor() {
    effect(() => {
      const sType = this.scopeType();
      if (sType) this.loadMedia(sType, this.scopeId() ?? null, this.includeGlobal());
    });
  }

  loadMedia(scopeType: number, scopeId: number | null, includeGlobal: boolean) {
    this.loading.set(true);
    this.mediaApi.listMedia({ scopeType, scopeId, includeGlobal, page: 1, pageSize: 60 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: MediaListResponse) => {
          this.items.set(res.items || []);
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file || !this.scopeType()) return;

    this.uploading.set(true);
    this.mediaApi.uploadMedia(file, this.scopeType()!, this.scopeId() ?? null)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (item) => {
          this.items.update(prev => [item, ...prev]);
          this.uploading.set(false);
          this.uploadSuccess.emit(item); // Emitimos para componentes antiguos
          this.modalItem.set(item);
        },
        error: () => {
          this.uploading.set(false);
          this.error.emit('Error al subir la imagen');
        }
      });
  }

  confirmSelection(item: MediaItem) {
    if (this.showDesignControls()) {
      this.pickWithDesign.emit({
        item,
        width: this.imgWidth() + '%',
        float: this.imgFloat()
      });
    } else {
      this.pick.emit(item);
    }
    this.modalItem.set(null);
  }

  onClose() { this.close.emit(); }
}
