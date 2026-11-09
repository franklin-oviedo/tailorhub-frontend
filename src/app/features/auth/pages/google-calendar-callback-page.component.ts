import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../data-access/auth.service';

@Component({
  selector: 'app-google-calendar-callback-page',
  template: `
    <section class="callback-page" aria-live="polite">
      @if (loading()) {
        <p>Conectando Google Calendar...</p>
      } @else if (errorMessage()) {
        <p class="error">{{ errorMessage() }}</p>
      } @else {
        <p>{{ successMessage() }}</p>
      }
    </section>
  `,
  styles: [`
    .callback-page {
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 1.5rem;
      text-align: center;
    }

    .callback-page p {
      margin: 0;
      color: #264653;
      font-weight: 600;
    }

    .callback-page .error {
      color: #b42318;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GoogleCalendarCallbackPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  constructor() {
    const code = this.route.snapshot.queryParamMap.get('code')?.trim() ?? '';

    if (!code) {
      this.loading.set(false);
      this.errorMessage.set('Google no devolvió un código de autorización válido.');
      return;
    }

    this.authService
      .linkGoogleCalendar({
        authorizationCode: code,
        redirectUri: environment.googleCalendarRedirectUri
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ calendarEmail }) => {
          this.successMessage.set(`Google Calendar vinculado: ${calendarEmail}`);
          setTimeout(() => {
            this.router.navigate(['/appointments']);
          }, 1200);
        },
        error: () => {
          this.errorMessage.set('No se pudo vincular Google Calendar. Inténtalo nuevamente.');
        }
      });
  }
}
