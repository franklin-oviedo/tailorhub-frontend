import { HttpRequest, HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { User } from '../models/domain.models';
import { SessionService } from '../services/session.service';
import { StoreContextService } from '../services/store-context.service';
import { storeInterceptor } from './store.interceptor';

const superAdminUserMock: User = {
  id: 'user-super-admin',
  role: 'super_admin',
  store: {
    id: 'store-1',
    name: 'Store 1',
    email: 'store1@example.com',
    phone: '809-000-0001',
    address: 'Address 1',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  employee: {
    id: 'employee-1',
    name: 'Super Admin',
    phone: '809-000-0002',
    email: 'admin@example.com',
    active: true,
    notes: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  customer: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z'
};

describe('storeInterceptor', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [StoreContextService, SessionService] });
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

  it('should not add x-store-id for users endpoint when role is super_admin', async () => {
    const session = TestBed.inject(SessionService);
    const storeContext = TestBed.inject(StoreContextService);
    session.setUser(superAdminUserMock);
    storeContext.setStoreId('store-1');
    const req = new HttpRequest('GET', '/users');

    const response$ = TestBed.runInInjectionContext(() => {
      return storeInterceptor(req, (nextReq) => {
        expect(nextReq.headers.has('x-store-id')).toBe(false);
        return of(new HttpResponse({ status: 200 }));
      });
    });

    await firstValueFrom(response$);
  });
});
