import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authGuard } from './auth.guard';
import { SessionService } from '../services/session.service';

describe('authGuard', () => {
  const sessionStub = {
    isAuthenticated: vi.fn()
  };

  const routerStub = {
    createUrlTree: vi.fn().mockReturnValue({ redirectedTo: '/login' })
  };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        { provide: SessionService, useValue: sessionStub },
        { provide: Router, useValue: routerStub }
      ]
    });
  });

  it('should allow navigation when authenticated', () => {
    sessionStub.isAuthenticated.mockReturnValue(true);

    const result = TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));

    expect(result).toBe(true);
    expect(routerStub.createUrlTree).not.toHaveBeenCalled();
  });

  it('should redirect to login when unauthenticated', () => {
    sessionStub.isAuthenticated.mockReturnValue(false);

    const result = TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));

    expect(routerStub.createUrlTree).toHaveBeenCalledWith(['/login']);
    expect(result).toEqual({ redirectedTo: '/login' });
  });
});
