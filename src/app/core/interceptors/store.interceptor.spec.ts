import { HttpRequest, HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { StoreContextService } from '../services/store-context.service';
import { storeInterceptor } from './store.interceptor';

describe('storeInterceptor', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [StoreContextService] });
  });

  it('should not add x-store-id when store is missing', async () => {
    const req = new HttpRequest('GET', '/test');

    const response$ = TestBed.runInInjectionContext(() => {
      return storeInterceptor(req, (nextReq) => {
        expect(nextReq.headers.has('x-store-id')).toBe(false);
        return of(new HttpResponse({ status: 200 }));
      });
    });

    await firstValueFrom(response$);
  });

  it('should add x-store-id when store exists', async () => {
    const storeContext = TestBed.inject(StoreContextService);
    storeContext.setStoreId('store-1');
    const req = new HttpRequest('GET', '/test');

    const response$ = TestBed.runInInjectionContext(() => {
      return storeInterceptor(req, (nextReq) => {
        expect(nextReq.headers.get('x-store-id')).toBe('store-1');
        return of(new HttpResponse({ status: 200 }));
      });
    });

    await firstValueFrom(response$);
  });
});
