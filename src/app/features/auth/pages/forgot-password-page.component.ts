import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from '../data-access/auth.service';

@Component({
  selector: 'app-forgot-password-page',
  imports: [
    NgOptimizedImage,
    ReactiveFormsModule,
    RouterLink,
    NgbAlertModule
  ],
  templateUrl: './forgot-password-page.html',
  styleUrl: './forgot-password-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ForgotPasswordPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  readonly loading = signal(false);
  readonly message = signal('');
  readonly errorMessage = signal('');

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]]
  });

  isInvalid(field: 'email'): boolean {
    const control = this.form.controls[field];

    return control.invalid && (control.touched || control.dirty);
  }

  isValid(field: 'email'): boolean {
    const control = this.form.controls[field];

    return control.valid && (control.touched || control.dirty);
  }

  submit(): void {
    if (this.form.invalid || this.loading()) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.message.set('');
    this.errorMessage.set('');

    this.authService
      .forgotPassword(this.form.getRawValue())
      .pipe(
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (response) => {
          this.message.set(
            response.message || 'Revisa tu bandeja de entrada.'
          );
        },
        error: () => {
          this.errorMessage.set(
            'No fue posible procesar la solicitud. Inténtalo nuevamente.'
          );
        }
      });
  }
}