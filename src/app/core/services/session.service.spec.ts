import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { User } from '../models/domain.models';
import { StoreContextService } from './store-context.service';
import { SessionService } from './session.service';

const userMock: User = {
  id: 'u1',
  email: 'u1@example.com',
  fullName: 'User One',
  role: 'admin',
  storeId: 's1',
  isActive: true
};

describe('SessionService', () => {
  let service: SessionService;
  let storeContext: StoreContextService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [SessionService, StoreContextService] });
    service = TestBed.inject(SessionService);
    storeContext = TestBed.inject(StoreContextService);
  });

  it('should initialize with null user and unauthenticated', () => {
    expect(service.user()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
    expect(service.role()).toBeNull();
  });

  it('should set user, persist it and update store context', () => {
    const setStoreSpy = vi.spyOn(storeContext, 'setStoreId');

    service.setUser(userMock);

    expect(service.user()).toEqual(userMock);
    expect(service.isAuthenticated()).toBe(true);
    expect(service.role()).toBe('admin');
    expect(localStorage.getItem('tailorhub_user')).toBe(JSON.stringify(userMock));
    expect(setStoreSpy).toHaveBeenCalledWith('s1');
  });

  it('should clear session and store context', () => {
    const clearStoreSpy = vi.spyOn(storeContext, 'clearStoreId');

    service.setUser(userMock);
    service.clear();

    expect(service.user()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
    expect(service.role()).toBeNull();
    expect(localStorage.getItem('tailorhub_user')).toBeNull();
    expect(clearStoreSpy).toHaveBeenCalled();
  });

  it('should recover user from storage on initialization', () => {
    localStorage.setItem('tailorhub_user', JSON.stringify(userMock));

    const recovered = TestBed.runInInjectionContext(() => new SessionService(storeContext));

    expect(recovered.user()).toEqual(userMock);
    expect(recovered.isAuthenticated()).toBe(true);
  });

  it('should handle invalid user payload in storage', () => {
    localStorage.setItem('tailorhub_user', '{bad-json');

    const recovered = TestBed.runInInjectionContext(() => new SessionService(storeContext));

    expect(recovered.user()).toBeNull();
    expect(localStorage.getItem('tailorhub_user')).toBeNull();
  });
});
