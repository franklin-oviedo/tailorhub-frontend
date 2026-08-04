import { HttpErrorResponse, HttpRequest, HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { firstValueFrom, Observable, of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SessionService } from '../services/session.service';
import { TokenService } from '../services/token.service';
import { errorInterceptor } from './error.interceptor';

describe('errorInterceptor', () => {
  const snackbarStub = { open: vi.fn() };
  const routerStub = { navigate: vi.fn() };
  const sessionStub = { clear: vi.fn() };
  const tokenServiceStub = { clearToken: vi.fn() };

  const req = new HttpRequest('GET', '/test');

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        { provide: MatSnackBar, useValue: snackbarStub },
        { provide: Router, useValue: routerStub },
        { provide: SessionService, useValue: sessionStub },
        { provide: TokenService, useValue: tokenServiceStub }
      ]
    });
  });

  const runWithError = (status: number, payload?: unknown): Observable<unknown> => {
    return TestBed.runInInjectionContext(() =>
      errorInterceptor(
        req,
        () => throwError(() => new HttpErrorResponse({ status, error: payload }))
      )
    );
  };

  it('should pass through successful responses', async () => {
    const response$ = TestBed.runInInjectionContext(() =>
      errorInterceptor(req, () => of(new HttpResponse({ status: 200 })))
    );

    const response = await firstValueFrom(response$);

    expect((response as HttpResponse<unknown>).status).toBe(200);
    expect(snackbarStub.open).not.toHaveBeenCalled();
  });

  it('should handle 401 by clearing session and redirecting to login', async () => {
    await expect(firstValueFrom(runWithError(401))).rejects.toBeTruthy();

    expect(tokenServiceStub.clearToken).toHaveBeenCalled();
    expect(sessionStub.clear).toHaveBeenCalled();
    expect(routerStub.navigate).toHaveBeenCalledWith(['/login']);
    expect(snackbarStub.open).toHaveBeenCalled();
  });

  it('should handle 403 with snackbar message', async () => {
    await expect(firstValueFrom(runWithError(403))).rejects.toBeTruthy();

    expect(snackbarStub.open).toHaveBeenCalledWith(
      'No tienes permisos para esta accion o tienda.',
      'Cerrar',
      { duration: 4000 }
    );
  });

  it('should handle 404 with snackbar message', async () => {
    await expect(firstValueFrom(runWithError(404))).rejects.toBeTruthy();

    expect(snackbarStub.open).toHaveBeenCalledWith('Recurso no encontrado.', 'Cerrar', {
      duration: 3000
    });
  });

  it('should handle 400 with string array message', async () => {
    await expect(
      firstValueFrom(runWithError(400, { message: ['Campo requerido', 'Formato invalido'] }))
    ).rejects.toBeTruthy();

    expect(snackbarStub.open).toHaveBeenCalledWith('Campo requerido, Formato invalido', 'Cerrar', {
      duration: 4500
    });
  });

  it('should handle 400 with string message', async () => {
    await expect(firstValueFrom(runWithError(400, { message: 'Regla de negocio invalida' }))).rejects.toBeTruthy();

    expect(snackbarStub.open).toHaveBeenCalledWith('Regla de negocio invalida', 'Cerrar', {
      duration: 4500
    });
  });

  it('should handle 400 with default message fallback', async () => {
    await expect(firstValueFrom(runWithError(400, {}))).rejects.toBeTruthy();

    expect(snackbarStub.open).toHaveBeenCalledWith('Solicitud invalida.', 'Cerrar', {
      duration: 4500
    });
  });

  it('should handle 400 with undefined error payload', async () => {
    await expect(firstValueFrom(runWithError(400))).rejects.toBeTruthy();

    expect(snackbarStub.open).toHaveBeenCalledWith('Solicitud invalida.', 'Cerrar', {
      duration: 4500
    });
  });

  it('should propagate unhandled error codes without snackbar', async () => {
    await expect(firstValueFrom(runWithError(500, { message: 'Internal error' }))).rejects.toBeTruthy();

    expect(snackbarStub.open).not.toHaveBeenCalled();
    expect(routerStub.navigate).not.toHaveBeenCalled();
  });
});
