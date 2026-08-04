import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { ApiConfigService } from './api-config.service';

describe('ApiConfigService', () => {
  it('should expose an api base url ending with /api', () => {
    TestBed.configureTestingModule({ providers: [ApiConfigService] });
    const service = TestBed.inject(ApiConfigService);

    expect(service.baseUrl.endsWith('/api')).toBe(true);
  });
});
