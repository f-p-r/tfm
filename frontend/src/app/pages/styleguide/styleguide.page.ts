import { Component, ChangeDetectionStrategy } from '@angular/core';
import { NavbarComponent } from '../../components/navbar/navbar.component';

@Component({
  selector: 'app-styleguide-page',
  imports: [NavbarComponent],
  templateUrl: './styleguide.page.html',
  styleUrl: './styleguide.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StyleguidePage {}
