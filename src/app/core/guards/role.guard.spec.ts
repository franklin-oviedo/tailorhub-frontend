import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { roleGuard } from './role.guard';
import { SessionService } from '../services/session.service';

describe('roleGuard', () => {
  const sessionStub = {
    role: vi.fn()
  };

  const routerStub = {
    createUrlTree: vi.fn().mockReturnValue({ redirectedTo: '/' })
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

  it('should allow when no roles are required', () => {
    const route = { data: {} } as never;

    const result = TestBed.runInInjectionContext(() => roleGuard(route, {} as never));

    expect(result).toBe(true);
  });

  it('should allow when role is included', () => {
    sessionStub.role.mockReturnValue('admin');
    const route = { data: { roles: ['admin'] } } as never;

    const result = TestBed.runInInjectionContext(() => roleGuard(route, {} as never));

    expect(result).toBe(true);
  });

  it('should redirect when role is not included', () => {
    sessionStub.role.mockReturnValue('client');
    const route = { data: { roles: ['admin'] } } as never;

    const result = TestBed.runInInjectionContext(() => roleGuard(route, {} as never));

    expect(routerStub.createUrlTree).toHaveBeenCalledWith(['/']);
    expect(result).toEqual({ redirectedTo: '/' });
  });
});
