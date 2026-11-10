import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { Customer, Store } from '../../../core/models/domain.models';
import { ApiConfigService } from '../../../core/services/api-config.service';

export interface CustomerWithStore extends Customer {
  store: Store;
}

export interface CreateCustomerPayload {
  name: string;
  email: string;
  phone: string;
}

export interface CustomerMeasurement {
  id: string;
  chest: number | null;
  waist: number | null;
  hips: number | null;
  neck: number | null;
  sleeve: number | null;
  inseam: number | null;
  notes: string | null;
  customer: Pick<Customer, 'id' | 'name' | 'email' | 'phone'>;
}

export interface CreateCustomerMeasurementPayload {
  customerId: string;
  chest?: number | null;
  waist?: number | null;
  hips?: number | null;
  neck?: number | null;
  sleeve?: number | null;
  inseam?: number | null;
  notes?: string;
}

export type UpdateCustomerPayload = CreateCustomerPayload;

@Injectable({ providedIn: 'root' })
export class CustomersService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ApiConfigService);

  listAll(): Observable<CustomerWithStore[]> {
    return this.http.get<CustomerWithStore[]>(`${this.config.baseUrl}/customers`);
  }

  detail(customerId: string): Observable<CustomerWithStore> {
    return this.http.get<CustomerWithStore>(`${this.config.baseUrl}/customers/${customerId}`);
  }

  measurement(customerId: string): Observable<CustomerMeasurement> {
    return this.http.get<CustomerMeasurement>(
      `${this.config.baseUrl}/customer/customer-measurements/${customerId}`
    );
  }

  createMeasurement(payload: CreateCustomerMeasurementPayload): Observable<CustomerMeasurement> {
    return this.http.post<CustomerMeasurement>(
      `${this.config.baseUrl}/customer/customer-measurements`,
      payload
    );
  }

  updateMeasurement(
    customerId: string,
    payload: CreateCustomerMeasurementPayload
  ): Observable<CustomerMeasurement> {
    return this.http.patch<CustomerMeasurement>(
      `${this.config.baseUrl}/customer/customer-measurements/${customerId}`,
      payload
    );
  }

  create(payload: CreateCustomerPayload): Observable<CustomerWithStore> {
    return this.http.post<CustomerWithStore>(`${this.config.baseUrl}/customers`, payload);
  }

  update(customerId: string, payload: UpdateCustomerPayload): Observable<CustomerWithStore> {
    return this.http.patch<CustomerWithStore>(`${this.config.baseUrl}/customers/${customerId}`, payload);
  }
}
