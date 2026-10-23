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

  create(payload: CreateCustomerPayload): Observable<CustomerWithStore> {
    return this.http.post<CustomerWithStore>(`${this.config.baseUrl}/customers`, payload);
  }

  update(customerId: string, payload: UpdateCustomerPayload): Observable<CustomerWithStore> {
    return this.http.patch<CustomerWithStore>(`${this.config.baseUrl}/customers/${customerId}`, payload);
  }
}
