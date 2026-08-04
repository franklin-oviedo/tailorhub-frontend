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

      if (status === 401) {
        tokenService.clearToken();
        session.clear();
        snackbar.open('Sesion expirada. Vuelve a iniciar sesion.', 'Cerrar', { duration: 3500 });
        router.navigate(['/login']);
      } else if (status === 403) {
        snackbar.open('No tienes permisos para esta accion o tienda.', 'Cerrar', { duration: 4000 });
      } else if (status === 404) {
        snackbar.open('Recurso no encontrado.', 'Cerrar', { duration: 3000 });
      } else if (status === 400) {
        const backendMessage =
          (error.error?.message as string | string[] | undefined) ?? 'Solicitud invalida.';
        const message = Array.isArray(backendMessage) ? backendMessage.join(', ') : backendMessage;
        snackbar.open(message, 'Cerrar', { duration: 4500 });
      }

      return throwError(() => error);
    })
  );
};
