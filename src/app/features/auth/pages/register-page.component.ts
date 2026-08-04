import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from '../data-access/auth.service';

@Component({
  selector: 'app-register-page',
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
          <h1>Crear cuenta</h1>
          <p class="subtitle">Completa los datos para crear tu acceso.</p>
        </header>

        <form [formGroup]="form" (ngSubmit)="submit()" class="auth-form">
          <div>
            <label class="form-label" for="registerName">Nombre completo</label>
            <input id="registerName" class="form-control th-input" formControlName="fullName" />
          </div>

          <div>
            <label class="form-label" for="registerEmail">Email</label>
            <input
              id="registerEmail"
              type="email"
              class="form-control th-input"
              formControlName="email"
              placeholder="correo@tailorhub.com"
            />
          </div>

          <div>
            <label class="form-label" for="registerPassword">Contrasena</label>
            <input
              id="registerPassword"
              type="password"
              class="form-control th-input"
              formControlName="password"
              placeholder="********"
            />
          </div>

          <div>
            <label class="form-label" for="registerRole">Rol</label>
            <select id="registerRole" class="form-select th-input" formControlName="role">
              <option value="client">Cliente</option>
              <option value="employee">Empleado</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div>
            <label class="form-label" for="registerStore">Store ID</label>
            <input id="registerStore" class="form-control th-input" formControlName="storeId" />
          </div>

          @if (errorMessage()) {
            <ngb-alert type="danger" [dismissible]="false" class="mb-0 py-2">
              {{ errorMessage() }}
            </ngb-alert>
          }

          <button class="btn th-btn-primary w-100" type="submit" [disabled]="form.invalid || loading()">
            {{ loading() ? 'Registrando...' : 'Registrarme' }}
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
      background: radial-gradient(circle at 90% 10%, rgba(201, 162, 39, 0.18) 0%, transparent 35%),
        linear-gradient(145deg, #1a2a40 0%, #2b4361 55%, #ffffff 180%);
    }

    .auth-card {
      width: min(100%, 32rem);
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
      color: var(--th-primary);
      text-decoration: none;
      font-weight: 600;
    }

    .link:hover {
      color: color-mix(in srgb, var(--th-primary) 70%, var(--th-secondary) 30%);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegisterPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly errorMessage = signal('');

  readonly form = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    role: ['client' as 'admin' | 'employee' | 'client', Validators.required],
    storeId: ['', Validators.required]
  });

  submit(): void {
    if (this.form.invalid) {
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');
    this.authService.register(this.form.getRawValue()).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.loading.set(false);
        this.errorMessage.set('No se pudo registrar la cuenta.');
      }
    });
  }
}
