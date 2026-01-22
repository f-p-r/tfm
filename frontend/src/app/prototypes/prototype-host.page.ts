import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import type { UrlSegment } from '@angular/router';

@Component({
  selector: 'app-prototype-host',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './prototype-host.page.html',
  styleUrl: './prototype-host.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrototypeHostPage {
  private readonly route = inject(ActivatedRoute);

  readonly subpath = computed(() => {
    const urlSegments = this.route.snapshot.url;
    const sub = urlSegments.map((s: UrlSegment) => s.path).join('/');
    return sub || '';
  });
}
