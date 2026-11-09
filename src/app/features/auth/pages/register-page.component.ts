import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { SessionService } from '../../../core/services/session.service';
import { AuthService } from '../data-access/auth.service';

@Component({
  selector: 'app-register-page',
  imports: [
    NgOptimizedImage,
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './register-page.html',
  styleUrl: './register-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegisterPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly errorMessage = signal('');

  readonly form = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    role: [
      'client' as 'admin' | 'manager' | 'employee' | 'client',
      Validators.required
    ],
    storeId: ['', Validators.required]
  });

  isInvalid(
    field: 'fullName' | 'email' | 'password' | 'role' | 'storeId'
  ): boolean {
    const control = this.form.controls[field];

    return control.invalid && (control.touched || control.dirty);
  }

  isValid(
    field: 'fullName' | 'email' | 'password' | 'role' | 'storeId'
  ): boolean {
    const control = this.form.controls[field];

    return control.valid && (control.touched || control.dirty);
  }

  submit(): void {
    if (this.form.invalid || this.loading()) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    this.authService
      .register(this.form.getRawValue())
      .pipe(
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: () => {
          this.router.navigateByUrl(this.session.getDefaultRoute());
        },
        error: () => {
          this.errorMessage.set(
            'No se pudo registrar la cuenta. Verifica los datos e inténtalo nuevamente.'
          );
        }
      });
  }
}