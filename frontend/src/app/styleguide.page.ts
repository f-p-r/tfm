import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-styleguide',
  templateUrl: './styleguide.page.html',
  styleUrl: './styleguide.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StyleguidePage {}
