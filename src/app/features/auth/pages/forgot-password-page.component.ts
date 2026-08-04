import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
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
  template: `
    <section class="auth-page">
      <div class="auth-card card border-0 shadow-sm">
        <header class="auth-head">
          <img
            ngSrc="th.png"
            width="96"
            height="96"
            alt="Logo de TailorHub"
            class="auth-logo"
            priority
          />
          <h1>Recuperar contrasena</h1>
          <p class="subtitle">Enviaremos instrucciones a tu correo.</p>
        </header>

        <form [formGroup]="form" (ngSubmit)="submit()" class="auth-form">
          <div>
            <label class="form-label" for="forgotEmail">Email</label>
            <input
              id="forgotEmail"
              type="email"
              class="form-control th-input"
              formControlName="email"
              placeholder="correo@tailorhub.com"
            />
          </div>

          @if (message()) {
            <ngb-alert type="success" [dismissible]="false" class="mb-0 py-2">
              {{ message() }}
            </ngb-alert>
          }

          <button class="btn th-btn-primary w-100" type="submit" [disabled]="form.invalid || loading()">
            {{ loading() ? 'Enviando...' : 'Enviar' }}
          </button>
        </form>

        <a routerLink="/login" class="link">Volver a login</a>
      </div>
    </section>
  `,
  styles: `
    .auth-page {
      min-height: 100dvh;
      display: grid;
      place-items: center;
      padding: 1.5rem;
      background: radial-gradient(circle at 20% 0%, rgba(201, 162, 39, 0.2) 0%, transparent 35%),
        linear-gradient(145deg, #1a2a40 0%, #2e4a68 60%, #ffffff 180%);
    }

    .auth-card {
      width: min(100%, 28rem);
      padding: 1.5rem;
      border-radius: 1rem;
      background: #ffffff;
      display: grid;
      gap: 1rem;
      justify-items: stretch;
      align-content: start;
    }

    .auth-head {
      display: grid;
      gap: 0.35rem;
      text-align: center;
      justify-items: center;
    }

    .auth-logo {
      display: block;
      margin: 0 auto;
      border-radius: 0.75rem;
      object-fit: cover;
    }

    h1 {
      color: var(--th-primary);
      margin: 0;
    }

    .subtitle {
      margin: 0;
      color: var(--th-text);
    }

    .auth-form {
      display: grid;
      gap: 0.75rem;
      width: 100%;
      align-items: stretch;
    }

    .auth-form button {
      width: 100%;
      min-height: 2.75rem;
    }

    ngb-alert {
      font-size: 0.92rem;
    }

    .link {
      display: inline-block;
      margin-top: 1rem;
      text-decoration: none;
      color: var(--th-primary);
      font-weight: 600;
    }

    .link:hover {
      color: color-mix(in srgb, var(--th-primary) 70%, var(--th-secondary) 30%);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ForgotPasswordPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  readonly loading = signal(false);
  readonly message = signal('');

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]]
  });

  submit(): void {
    if (this.form.invalid) {
      return;
    }

    this.loading.set(true);
    this.message.set('');
    this.authService.forgotPassword(this.form.getRawValue()).subscribe({
      next: (response) => {
        this.loading.set(false);
        this.message.set(response.message || 'Revisa tu bandeja de entrada.');
      },
      error: () => {
        this.loading.set(false);
        this.message.set('No fue posible procesar la solicitud.');
      }
    });
  }
}
