import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from '../data-access/auth.service';

@Component({
  selector: 'app-login-page',
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
          <h1>Iniciar sesion</h1>
          <p class="subtitle">Accede a la plataforma de tu sastreria.</p>
        </header>

        <form [formGroup]="form" (ngSubmit)="submit()" class="auth-form">
          <div>
            <label class="form-label" for="loginEmail">Email</label>
            <input
              id="loginEmail"
              type="email"
              class="form-control th-input"
              [class.is-invalid]="isInvalid('email')"
              [class.is-valid]="isValid('email')"
              formControlName="email"
              placeholder="correo@tailorhub.com"
            />
            @if (isInvalid('email')) {
              <div class="invalid-feedback d-block">Ingresa un correo valido.</div>
            }
          </div>

          <div>
            <label class="form-label" for="loginPassword">Contrasena</label>
            <input
              id="loginPassword"
              type="password"
              class="form-control th-input"
              [class.is-invalid]="isInvalid('password')"
              [class.is-valid]="isValid('password')"
              formControlName="password"
              placeholder="********"
            />
            @if (isInvalid('password')) {
              <div class="invalid-feedback d-block">La contrasena debe tener al menos 6 caracteres.</div>
            }
          </div>

          @if (errorMessage()) {
            <ngb-alert type="danger" [dismissible]="false" class="mb-0 py-2">
              {{ errorMessage() }}
            </ngb-alert>
          }

          <button class="btn th-btn-primary w-100" type="submit" [disabled]="form.invalid || loading()">
            {{ loading() ? 'Ingresando...' : 'Ingresar' }}
          </button>
        </form>

        <div class="links">
          <a routerLink="/register">Crear cuenta</a>
          <a routerLink="/forgot-password">Olvide mi contrasena</a>
        </div>
      </div>
    </section>
  `,
  styles: `
    .auth-page {
      min-height: 100dvh;
      display: grid;
      place-items: center;
      padding: 1.5rem;
      background: radial-gradient(circle at 15% 10%, rgba(201, 162, 39, 0.2) 0%, transparent 35%),
        linear-gradient(145deg, #1a2a40 0%, #243953 55%, #ffffff 180%);
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
      color: var(--th-text);
      margin: 0;
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

    .links {
      margin-top: 1rem;
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .links a {
      color: var(--th-primary);
      text-decoration: none;
      font-weight: 600;
    }

    .links a:hover {
      color: color-mix(in srgb, var(--th-primary) 70%, var(--th-secondary) 30%);
    }

    ngb-alert {
      font-size: 0.92rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly errorMessage = signal('');

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  isInvalid(field: 'email' | 'password'): boolean {
    const control = this.form.controls[field];
    return control.invalid && (control.touched || control.dirty);
  }

  isValid(field: 'email' | 'password'): boolean {
    const control = this.form.controls[field];
    return control.valid && (control.touched || control.dirty);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');
    this.authService.login(this.form.getRawValue()).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.loading.set(false);
        this.errorMessage.set('No se pudo iniciar sesion. Verifica tus credenciales.');
      }
    });
  }
}
