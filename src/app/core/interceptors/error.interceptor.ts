import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, throwError } from 'rxjs';
import { SessionService } from '../services/session.service';
import { TokenService } from '../services/token.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const snackbar = inject(MatSnackBar);
  const router = inject(Router);
  const session = inject(SessionService);
  const tokenService = inject(TokenService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const status = error.status;
      const isAuthEndpoint =
        req.url.includes('/auth/login') ||
        req.url.includes('/auth/register') ||
        req.url.includes('/auth/forgot-password');

      if (status === 401 && !isAuthEndpoint) {
        tokenService.clearToken();
        session.clear();
        snackbar.open('Sesión expirada. Vuelve a iniciar sesión.', 'Cerrar', { duration: 3500 });
        router.navigate(['/login']);
      } else if (status === 403) {
        snackbar.open('No tienes permisos para esta accion o tienda.', 'Cerrar', { duration: 4000 });
      } else if (status === 404) {
        snackbar.open('Recurso no encontrado.', 'Cerrar', { duration: 3000 });
      } else if (status === 400) {
        const backendMessage =
          (error.error?.message as string | string[] | undefined) ?? 'Solicitud invalida.';
        const message = Array.isArray(backendMessage) ? backendMessage.join(', ') : backendMessage;
        const normalizedMessage = message.toLowerCase().includes('numeric value must be finite')
          ? 'Hay datos numéricos inválidos en origen. Revisa cantidad, precio unitario o tasas en el pedido/factura y vuelve a intentar.'
          : message;
        snackbar.open(normalizedMessage, 'Cerrar', { duration: 4500 });
      }

      return throwError(() => error);
    })
  );
};
