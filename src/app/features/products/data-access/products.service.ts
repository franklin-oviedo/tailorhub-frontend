import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { PaginatedResponse, Product } from '../../../core/models/domain.models';
import { ApiConfigService } from '../../../core/services/api-config.service';

export interface ProductsQuery {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ProductsService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ApiConfigService);

  list(query: ProductsQuery = {}): Observable<PaginatedResponse<Product>> {
    return this.http.get<PaginatedResponse<Product>>(`${this.config.baseUrl}/products`, {
      params: query as never
    });
  }

  detail(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.config.baseUrl}/products/${id}`);
  }

  create(payload: Omit<Product, 'id'>): Observable<Product> {
    return this.http.post<Product>(`${this.config.baseUrl}/products`, payload);
  }

  update(productId: string, payload: Partial<Product>): Observable<Product> {
    return this.http.patch<Product>(`${this.config.baseUrl}/products/${productId}`, payload);
  }

  remove(productId: string): Observable<void> {
    return this.http.delete<void>(`${this.config.baseUrl}/products/${productId}`);
  }
}
