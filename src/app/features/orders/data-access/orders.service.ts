import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CreateOrderPayload, Order, OrderStatus, PaginatedResponse } from '../../../core/models/domain.models';
import { ApiConfigService } from '../../../core/services/api-config.service';

export interface OrdersQuery {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  customerId?: string;
}

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ApiConfigService);

  list(query: OrdersQuery = {}): Observable<PaginatedResponse<Order>> {
    return this.http.get<PaginatedResponse<Order>>(`${this.config.baseUrl}/orders`, {
      params: query as never
    });
  }

  create(payload: Omit<CreateOrderPayload, 'id' | 'createdAt'>): Observable<CreateOrderPayload> {
    return this.http.post<CreateOrderPayload>(`${this.config.baseUrl}/orders`, payload);
  }

  detail(orderId: string): Observable<Order> {
    return this.http.get<Order>(`${this.config.baseUrl}/orders/${orderId}`);
  }

  updateStatus(orderId: string, status: OrderStatus): Observable<Order> {
    return this.http.patch<Order>(`${this.config.baseUrl}/orders/${orderId}/status`, { status });
  }

  remove(orderId: string): Observable<void> {
    return this.http.delete<void>(`${this.config.baseUrl}/orders/${orderId}`);
  }
}
