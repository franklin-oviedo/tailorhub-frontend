import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { SessionService } from '../../../core/services/session.service';
import { AuthService } from '../data-access/auth.service';

@Component({
  selector: 'app-accept-google-invitation-page',
  imports: [ReactiveFormsModule],
  templateUrl: './accept-google-invitation-page.html',
  styleUrl: './accept-google-invitation-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AcceptGoogleInvitationPageComponent {
  private readonly authService = inject(AuthService);
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly invitationToken = signal(this.readInvitationTokenFromUrl());

  readonly form = this.fb.nonNullable.group({
    phone: ['', [Validators.maxLength(25)]]
  });

  constructor() {
    this.loadGoogleIdentityScript();
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
    const token = this.invitationToken();
    if (!token) {
      this.errorMessage.set('El enlace de invitación es inválido o está incompleto.');
      return;
    }

    if (!environment.googleClientId) {
      this.errorMessage.set(
        'Falta configurar Google Client ID. Agrega googleClientId en src/environments/environment.ts.'
      );
      return;
    }

    const { google } = window;
    const buttonContainer = document.getElementById('google-invitation-button');

    if (!google?.accounts?.id || !buttonContainer) {
      return;
    }

    google.accounts.id.initialize({
      client_id: environment.googleClientId,
      callback: (response: GoogleIdentityCredentialResponse) => {
        this.handleGoogleCredential(response, token);
      },
      auto_select: false,
      cancel_on_tap_outside: true
    });

    buttonContainer.innerHTML = '';
    google.accounts.id.renderButton(buttonContainer, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'rectangular',
      logo_alignment: 'left',
      width: 320,
      locale: 'es'
    });
  }

  private handleGoogleCredential(response: GoogleIdentityCredentialResponse, invitationToken: string): void {
    if (!response?.credential) {
      this.errorMessage.set('Google no devolvió una credencial válida.');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    const rawPhone = this.form.controls.phone.value.trim();

    this.authService
      .acceptGoogleInvitation({
        invitationToken,
        credential: response.credential,
        phone: rawPhone.length > 0 ? rawPhone : undefined
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          this.router.navigateByUrl(this.session.getDefaultRoute());
        },
        error: () => {
          this.errorMessage.set(
            'No se pudo aceptar la invitación con Google. Verifica el enlace o solicita una nueva invitación.'
          );
        }
      });
  }

  private readInvitationTokenFromUrl(): string {
    const params = new URLSearchParams(globalThis.location.search);
    const queryToken =
      params.get('token')?.trim() ??
      params.get('invitationToken')?.trim() ??
      params.get('invitation_token')?.trim() ??
      '';

    if (queryToken) {
      return queryToken;
    }

    const routeToken = this.route.snapshot.paramMap.get('token')?.trim() ?? '';
    if (routeToken) {
      return routeToken;
    }

    const hashQuery = globalThis.location.hash.includes('?')
      ? globalThis.location.hash.split('?')[1] ?? ''
      : '';

    if (hashQuery) {
      const hashParams = new URLSearchParams(hashQuery);
      const hashToken =
        hashParams.get('token')?.trim() ??
        hashParams.get('invitationToken')?.trim() ??
        hashParams.get('invitation_token')?.trim() ??
        '';

      if (hashToken) {
        return hashToken;
      }
    }

    return '';
  }
}
