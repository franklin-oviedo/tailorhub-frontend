import { HttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiConfigService } from '../../../core/services/api-config.service';
import { CustomersService, CustomerWithStore } from './customers.service';

describe('CustomersService', () => {
  let service: CustomersService;
  let httpStub: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    patch: ReturnType<typeof vi.fn>;
  };

  const customerOne: CustomerWithStore = {
    id: 'c-1',
    name: 'Customer One',
    email: 'customer1@example.com',
    phone: '809-222-2222',
    store: {
      id: 'store-1',
      name: 'Store One',
      email: 'store1@example.com',
      phone: '809-111-1111',
      address: 'Address 1',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  };

  beforeEach(() => {
    httpStub = {
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        CustomersService,
        { provide: HttpClient, useValue: httpStub },
        { provide: ApiConfigService, useValue: { baseUrl: 'https://api.example.test' } }
      ]
    });

    service = TestBed.inject(CustomersService);
  });

  it('should request customers endpoint', () => {
    httpStub.get.mockReturnValue(of([customerOne]));

    let result: CustomerWithStore[] = [];

    service.listAll().subscribe((customers) => {
      result = customers;
    });

    expect(httpStub.get).toHaveBeenCalledWith('https://api.example.test/customers');
    expect(result).toEqual([customerOne]);
  });

  it('should request customer detail endpoint', () => {
    httpStub.get.mockReturnValue(of(customerOne));

    let result: CustomerWithStore | null = null;

    service.detail(customerOne.id).subscribe((customer) => {
      result = customer;
    });

    expect(httpStub.get).toHaveBeenCalledWith(
      `https://api.example.test/customers/${customerOne.id}`
    );
    expect(result).toEqual(customerOne);
  });

  it('should create customer using customers endpoint', () => {
    const payload = {
      name: 'Ana Martinez',
      email: 'ana.martinez@example.com',
      phone: '+57 300 123 4567'
    };

    httpStub.post.mockReturnValue(of(customerOne));

    let result: CustomerWithStore | null = null;

    service.create(payload).subscribe((customer) => {
      result = customer;
    });

    expect(httpStub.post).toHaveBeenCalledWith('https://api.example.test/customers', payload);
    expect(result).toEqual(customerOne);
  });

  it('should update customer using customer detail endpoint', () => {
    const payload = {
      name: 'Ana Maria Martinez',
      email: 'ana.maria@example.com',
      phone: '+57 301 987 6543'
    };

    const updatedCustomer: CustomerWithStore = {
      ...customerOne,
      ...payload
    };

    httpStub.patch.mockReturnValue(of(updatedCustomer));

    let result: CustomerWithStore | null = null;

    service.update(customerOne.id, payload).subscribe((customer) => {
      result = customer;
    });

    expect(httpStub.patch).toHaveBeenCalledWith(
      `https://api.example.test/customer/${customerOne.id}`,
      payload
    );
    expect(result).toEqual(updatedCustomer);
  });
});
