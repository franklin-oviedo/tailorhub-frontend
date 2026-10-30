import { HttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiConfigService } from '../../../core/services/api-config.service';
import { CustomerMeasurement, CustomersService, CustomerWithStore } from './customers.service';

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

  const customerOneMeasurement: CustomerMeasurement = {
    id: 'm-1',
    chest: 36,
    waist: 32,
    hips: 40,
    neck: 15,
    sleeve: 34,
    inseam: 32,
    notes: 'Prefiere corte slim.',
    customer: {
      id: 'c-1',
      name: 'Customer One',
      email: 'customer1@example.com',
      phone: '809-222-2222'
    }
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

  it('should request customer measurement endpoint by customer id', () => {
    httpStub.get.mockReturnValue(of(customerOneMeasurement));

    let result: CustomerMeasurement | null = null;

    service.measurement(customerOne.id).subscribe((measurement) => {
      result = measurement;
    });

    expect(httpStub.get).toHaveBeenCalledWith(
      `https://api.example.test/customer/customer-measurements/${customerOne.id}`
    );
    expect(result).toEqual(customerOneMeasurement);
  });

  it('should create customer measurement using customer measurements endpoint', () => {
    const payload = {
      customerId: 'c-1',
      chest: 36,
      waist: 32,
      hips: 40,
      neck: 15,
      sleeve: 34,
      inseam: 32,
      notes: 'Prefiere corte slim.'
    };

    httpStub.post.mockReturnValue(of(customerOneMeasurement));

    let result: CustomerMeasurement | null = null;

    service.createMeasurement(payload).subscribe((measurement) => {
      result = measurement;
    });

    expect(httpStub.post).toHaveBeenCalledWith(
      'https://api.example.test/customer/customer-measurements',
      payload
    );
    expect(result).toEqual(customerOneMeasurement);
  });

  it('should update customer measurement using customer measurements endpoint', () => {
    const payload = {
      customerId: 'c-1',
      chest: 37,
      waist: 33,
      hips: 41,
      neck: 15.5,
      sleeve: 34.5,
      inseam: 32,
      notes: 'Actualizado.'
    };

    const updatedMeasurement: CustomerMeasurement = {
      ...customerOneMeasurement,
      chest: payload.chest,
      waist: payload.waist,
      hips: payload.hips,
      neck: payload.neck,
      sleeve: payload.sleeve,
      notes: payload.notes
    };

    httpStub.patch.mockReturnValue(of(updatedMeasurement));

    let result: CustomerMeasurement | null = null;

    service.updateMeasurement('c-1', payload).subscribe((measurement) => {
      result = measurement;
    });

    expect(httpStub.patch).toHaveBeenCalledWith(
      'https://api.example.test/customer/customer-measurements/c-1',
      payload
    );
    expect(result).toEqual(updatedMeasurement);
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
      `https://api.example.test/customers/${customerOne.id}`,
      payload
    );
    expect(result).toEqual(updatedCustomer);
  });
});
