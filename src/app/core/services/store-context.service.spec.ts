import { TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach } from 'vitest';
import { StoreContextService } from './store-context.service';

describe('StoreContextService', () => {
  let service: StoreContextService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [StoreContextService] });
    service = TestBed.inject(StoreContextService);
  });

  it('should initialize with null when storage is empty', () => {
    expect(service.storeId()).toBeNull();
  });

  it('should set and persist store id', () => {
    service.setStoreId('store-1');

    expect(service.storeId()).toBe('store-1');
    expect(localStorage.getItem('tailorhub_store_id')).toBe('store-1');
  });

  it('should clear and remove store id', () => {
    service.setStoreId('store-1');
    service.clearStoreId();

    expect(service.storeId()).toBeNull();
    expect(localStorage.getItem('tailorhub_store_id')).toBeNull();
  });
});
