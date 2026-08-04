import { TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach } from 'vitest';
import { TokenService } from './token.service';

describe('TokenService', () => {
  let service: TokenService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [TokenService] });
    service = TestBed.inject(TokenService);
  });

  it('should return null when token is missing', () => {
    expect(service.token).toBeNull();
  });

  it('should save and return token', () => {
    service.setToken('abc123');

    expect(service.token).toBe('abc123');
    expect(localStorage.getItem('tailorhub_access_token')).toBe('abc123');
  });

  it('should clear token', () => {
    service.setToken('abc123');
    service.clearToken();

    expect(service.token).toBeNull();
    expect(localStorage.getItem('tailorhub_access_token')).toBeNull();
  });
});
