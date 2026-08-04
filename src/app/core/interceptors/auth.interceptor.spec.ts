import { HttpRequest, HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { TokenService } from '../services/token.service';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [TokenService] });
  });

  it('should not add authorization header when token is missing', async () => {
    const req = new HttpRequest('GET', '/test');

    const response$ = TestBed.runInInjectionContext(() => {
      return authInterceptor(req, (nextReq) => {
        expect(nextReq.headers.has('Authorization')).toBe(false);
        return of(new HttpResponse({ status: 200 }));
      });
    });

    await firstValueFrom(response$);
  });

  it('should add authorization header when token exists', async () => {
    const tokenService = TestBed.inject(TokenService);
    tokenService.setToken('jwt-token');
    const req = new HttpRequest('GET', '/test');

    const response$ = TestBed.runInInjectionContext(() => {
      return authInterceptor(req, (nextReq) => {
        expect(nextReq.headers.get('Authorization')).toBe('Bearer jwt-token');
        return of(new HttpResponse({ status: 200 }));
      });
    });

    await firstValueFrom(response$);
  });
});
