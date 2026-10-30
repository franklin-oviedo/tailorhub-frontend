import { HttpErrorResponse, HttpRequest, HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { firstValueFrom, Observable, of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SessionService } from '../services/session.service';
import { TokenService } from '../services/token.service';
import { errorInterceptor } from './error.interceptor';

describe('errorInterceptor', () => {
  const routerStub = { navigate: vi.fn() };
  const sessionStub = { clear: vi.fn() };
  const tokenServiceStub = { clearToken: vi.fn() };

  const req = new HttpRequest('GET', '/test');

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
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
  });

  it('should handle 401 by clearing session and redirecting to login', async () => {
    await expect(firstValueFrom(runWithError(401))).rejects.toBeTruthy();

    expect(tokenServiceStub.clearToken).toHaveBeenCalled();
    expect(sessionStub.clear).toHaveBeenCalled();
    expect(routerStub.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should not show session-expired flow for auth endpoints', async () => {
    const authReq = new HttpRequest('POST', '/api/auth/login', null);

    const response$ = TestBed.runInInjectionContext(() =>
      errorInterceptor(
        authReq,
        () => throwError(() => new HttpErrorResponse({ status: 401, error: { message: 'Invalid credentials' } }))
      )
    );

    await expect(firstValueFrom(response$)).rejects.toBeTruthy();

    expect(tokenServiceStub.clearToken).not.toHaveBeenCalled();
    expect(sessionStub.clear).not.toHaveBeenCalled();
    expect(routerStub.navigate).not.toHaveBeenCalled();
  });

  it('should handle 403 without redirect', async () => {
    await expect(firstValueFrom(runWithError(403))).rejects.toBeTruthy();
    expect(routerStub.navigate).not.toHaveBeenCalled();
  });

  it('should handle 404 without redirect', async () => {
    await expect(firstValueFrom(runWithError(404))).rejects.toBeTruthy();
    expect(routerStub.navigate).not.toHaveBeenCalled();
  });

  it('should handle 400 with string array message', async () => {
    await expect(
      firstValueFrom(runWithError(400, { message: ['Campo requerido', 'Formato invalido'] }))
    ).rejects.toBeTruthy();
  });

  it('should handle 400 with string message', async () => {
    await expect(firstValueFrom(runWithError(400, { message: 'Regla de negocio invalida' }))).rejects.toBeTruthy();
  });

  it('should map numeric finite backend message to friendly text', async () => {
    await expect(firstValueFrom(runWithError(400, { message: 'Numeric value must be finite.' }))).rejects.toBeTruthy();
  });

  it('should handle 400 with default message fallback', async () => {
    await expect(firstValueFrom(runWithError(400, {}))).rejects.toBeTruthy();
  });

  it('should handle 400 with undefined error payload', async () => {
    await expect(firstValueFrom(runWithError(400))).rejects.toBeTruthy();
  });

  it('should propagate unhandled error codes without redirect', async () => {
    await expect(firstValueFrom(runWithError(500, { message: 'Internal error' }))).rejects.toBeTruthy();

    expect(routerStub.navigate).not.toHaveBeenCalled();
  });
});
