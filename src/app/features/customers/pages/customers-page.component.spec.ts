import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CustomerWithStore, CustomersService } from '../data-access/customers.service';
import { CustomersPageComponent } from './customers-page.component';

describe('CustomersPageComponent', () => {
  let fixture: ComponentFixture<CustomersPageComponent>;
  let component: CustomersPageComponent;

  const customer: CustomerWithStore = {
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

  const customersServiceStub = {
    listAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn()
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [CustomersPageComponent],
      providers: [
        { provide: CustomersService, useValue: customersServiceStub }
      ]
    }).compileComponents();
  });

  it('should load customers list', async () => {
    customersServiceStub.listAll.mockReturnValue(of([customer]));

    fixture = TestBed.createComponent(CustomersPageComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();

    expect(customersServiceStub.listAll).toHaveBeenCalled();
    expect(component.loading()).toBe(false);
    expect(component.customers()).toEqual([customer]);
  });

  it('should report empty state when no customers are returned', async () => {
    customersServiceStub.listAll.mockReturnValue(of([]));

    fixture = TestBed.createComponent(CustomersPageComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();

    expect(customersServiceStub.listAll).toHaveBeenCalled();
    expect(component.isEmpty()).toBe(true);
  });

  it('should set error message when request fails', async () => {
    customersServiceStub.listAll.mockReturnValue(
      throwError(() => new Error('network failure'))
    );

    fixture = TestBed.createComponent(CustomersPageComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();

    expect(component.loading()).toBe(false);
    expect(component.errorMessage()).toContain('No fue posible cargar');
  });

  it('should create a customer and prepend it to the list', async () => {
    customersServiceStub.listAll.mockReturnValue(of([customer]));

    const createdCustomer: CustomerWithStore = {
      ...customer,
      id: 'c-2',
      name: 'Ana Martinez',
      email: 'ana.martinez@example.com',
      phone: '+57 300 123 4567'
    };

    customersServiceStub.create.mockReturnValue(of(createdCustomer));

    fixture = TestBed.createComponent(CustomersPageComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();

    component.createForm.setValue({
      name: 'Ana Martinez',
      email: 'ana.martinez@example.com',
      phone: '+57 300 123 4567'
    });

    component.createCustomer();

    expect(customersServiceStub.create).toHaveBeenCalledWith({
      name: 'Ana Martinez',
      email: 'ana.martinez@example.com',
      phone: '+57 300 123 4567'
    });
    expect(component.customers()[0]).toEqual(createdCustomer);
    expect(component.createSuccessMessage()).toContain('Cliente creado correctamente');
  });

  it('should set create error message when create fails', async () => {
    customersServiceStub.listAll.mockReturnValue(of([]));
    customersServiceStub.create.mockReturnValue(throwError(() => new Error('create failure')));

    fixture = TestBed.createComponent(CustomersPageComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();

    component.createForm.setValue({
      name: 'Ana Martinez',
      email: 'ana.martinez@example.com',
      phone: '+57 300 123 4567'
    });

    component.createCustomer();

    expect(component.createErrorMessage()).toContain('No fue posible crear el cliente');
  });

  it('should update an existing customer', async () => {
    customersServiceStub.listAll.mockReturnValue(of([customer]));

    const updatedCustomer: CustomerWithStore = {
      ...customer,
      name: 'Ana Maria Martinez',
      email: 'ana.maria@example.com',
      phone: '+57 301 987 6543'
    };

    customersServiceStub.update.mockReturnValue(of(updatedCustomer));

    fixture = TestBed.createComponent(CustomersPageComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();

    component.startEdit(customer);
    component.updateForm.setValue({
      name: 'Ana Maria Martinez',
      email: 'ana.maria@example.com',
      phone: '+57 301 987 6543'
    });

    component.updateCustomer();

    expect(customersServiceStub.update).toHaveBeenCalledWith('c-1', {
      name: 'Ana Maria Martinez',
      email: 'ana.maria@example.com',
      phone: '+57 301 987 6543'
    });
    expect(component.customers()[0]).toEqual(updatedCustomer);
    expect(component.updateSuccessMessage()).toContain('Cliente actualizado correctamente');
  });

  it('should set update error message when update fails', async () => {
    customersServiceStub.listAll.mockReturnValue(of([customer]));
    customersServiceStub.update.mockReturnValue(throwError(() => new Error('update failure')));

    fixture = TestBed.createComponent(CustomersPageComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();

    component.startEdit(customer);
    component.updateForm.setValue({
      name: 'Ana Maria Martinez',
      email: 'ana.maria@example.com',
      phone: '+57 301 987 6543'
    });

    component.updateCustomer();

    expect(component.updateErrorMessage()).toContain('No fue posible actualizar el cliente');
  });
});
