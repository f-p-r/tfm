import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HelpIComponent } from '../../shared/help/help-i/help-i.component';
import { HelpHoverDirective } from '../../shared/help/help-hover.directive';
import { NavbarComponent } from '../../components/navbar/navbar.component';

@Component({
  selector: 'app-help-demo',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HelpIComponent, HelpHoverDirective, NavbarComponent],
  templateUrl: './help-demo.page.html',
  styleUrl: './help-demo.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HelpDemoPage {
  private fb = inject(FormBuilder);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    privacy: [false, [Validators.requiredTrue]],
    description: ['', [Validators.required, Validators.minLength(10)]]
  });

  onSubmit() {
    if (this.form.valid) {
      console.log('Form submitted:', this.form.value);
      alert('Formulario enviado correctamente');
    } else {
      this.form.markAllAsTouched();
    }
  }

  get email() {
    return this.form.get('email')!;
  }

  get privacy() {
    return this.form.get('privacy')!;
  }

  get description() {
    return this.form.get('description')!;
  }
}
