import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { SessionService } from '../../../core/services/session.service';
import { AuthService } from '../data-access/auth.service';

@Component({
  selector: 'app-login-page',
  imports: [
    NgOptimizedImage,
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly errorMessage = signal('');

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  ngOnInit(): void {
    this.loadGoogleIdentityScript();
  }

  isInvalid(field: 'email' | 'password'): boolean {
    const control = this.form.controls[field];

    return control.invalid && (control.touched || control.dirty);
  }

  isValid(field: 'email' | 'password'): boolean {
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
      .login(this.form.getRawValue())
      .pipe(
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: () => {
          this.router.navigateByUrl(this.session.getDefaultRoute());
        },
        error: () => {
          this.errorMessage.set(
            'No se pudo iniciar sesión. Verifica tus credenciales.'
          );
        }
      });
  }

  private loadGoogleIdentityScript(): void {
    if (!environment.googleClientId) {
      this.errorMessage.set(
        'Falta configurar Google Client ID. Agrega googleClientId en src/environments/environment.ts.'
      );
      return;
    }

    const scriptId = 'google-gsi-script';
    const existingScript = document.getElementById(scriptId);

    if (existingScript) {
      this.initGoogleButton();
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => this.initGoogleButton();
    script.onerror = () => {
      this.errorMessage.set('No se pudo cargar Google Identity Services.');
    };

    document.head.appendChild(script);
  }

  private initGoogleButton(): void {
    if (!environment.googleClientId) {
      this.errorMessage.set(
        'Falta configurar Google Client ID. Agrega googleClientId en src/environments/environment.ts.'
      );
      return;
    }

    const { google } = window;
    const buttonContainer = document.getElementById('google-signin-button');

    if (!google?.accounts?.id || !buttonContainer) {
      return;
    }

    google.accounts.id.initialize({
      client_id: environment.googleClientId,
      callback: (response: GoogleIdentityCredentialResponse) => {
        this.handleGoogleCredential(response);
      },
      auto_select: false,
      cancel_on_tap_outside: true
    });

    google.accounts.id.renderButton(buttonContainer, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'rectangular',
      logo_alignment: 'left',
      width: 340,
      locale: 'es'
    });
  }

  private handleGoogleCredential(response: GoogleIdentityCredentialResponse): void {
    if (!response?.credential) {
      this.errorMessage.set('Google no devolvió una credencial válida.');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    this.authService
      .googleLogin({ credential: response.credential })
      .pipe(
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: () => {
          this.router.navigateByUrl(this.session.getDefaultRoute());
        },
        error: () => {
          this.errorMessage.set(
            'No se pudo iniciar sesión con Google. Inténtalo nuevamente.'
          );
        }
      });
  }
}