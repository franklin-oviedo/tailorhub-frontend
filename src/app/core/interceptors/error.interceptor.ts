import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { SessionService } from '../services/session.service';
import { TokenService } from '../services/token.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const session = inject(SessionService);
  const tokenService = inject(TokenService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const status = error.status;
      const isAuthEndpoint =
        req.url.includes('/auth/login') ||
        req.url.includes('/auth/register') ||
            req.url.includes('/auth/google') ||
            req.url.includes('/auth/forgot-password');

      if (status === 401 && !isAuthEndpoint) {
        tokenService.clearToken();
        session.clear();
        router.navigate(['/login']);
      } else if (status === 400) {
        const backendMessage =
          (error.error?.message as string | string[] | undefined) ?? 'Solicitud invalida.';
        const message = Array.isArray(backendMessage) ? backendMessage.join(', ') : backendMessage;
        const normalizedMessage = message.toLowerCase().includes('numeric value must be finite')
          ? 'Hay datos numéricos inválidos en origen. Revisa cantidad, precio unitario o tasas en el pedido/factura y vuelve a intentar.'
          : message;

        if (
          req.url.includes('/auth/login') ||
          req.url.includes('/auth/register') ||
          req.url.includes('/auth/google') ||
          req.url.includes('/auth/forgot-password')
        ) {
          const originalErrorPayload =
            typeof error.error === 'object' && error.error !== null ? error.error : {};

          return throwError(() => new HttpErrorResponse({
            headers: error.headers,
            status: error.status,
            statusText: error.statusText,
            url: error.url ?? undefined,
            redirected: error.redirected,
            error: {
              ...originalErrorPayload,
              message: normalizedMessage,
            },
          }));
        }
      }

      return throwError(() => error);
    })
  );
};
