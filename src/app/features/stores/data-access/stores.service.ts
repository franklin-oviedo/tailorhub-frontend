import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { PaginatedResponse, Store } from '../../../core/models/domain.models';
import { ApiConfigService } from '../../../core/services/api-config.service';

export interface StoresQuery {
  page?: number;
  limit?: number;
  search?: string;
}

export interface CreateStorePayload {
  name: string;
  email: string;
  phone: string;
  address: string;
}

@Injectable({ providedIn: 'root' })
export class StoresService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ApiConfigService);

  list(query: StoresQuery = {}): Observable<PaginatedResponse<Store>> {
    return this.http.get<PaginatedResponse<Store>>(`${this.config.baseUrl}/stores`, {
      params: query as never
    });
  }

  create(payload: CreateStorePayload): Observable<Store> {
    return this.http.post<Store>(`${this.config.baseUrl}/stores`, payload);
  }

  detail(storeId: string): Observable<Store> {
    return this.http.get<Store>(`${this.config.baseUrl}/stores/${storeId}`);
  }

  update(storeId: string, payload: Partial<Store>): Observable<Store> {
    return this.http.patch<Store>(`${this.config.baseUrl}/stores/${storeId}`, payload);
  }

  uploadLogo(storeId: string, file: File): Observable<Store> {
    const body = new FormData();
    body.append('file', file);

    return this.http.patch<Store>(`${this.config.baseUrl}/stores/${storeId}/logo`, body);
  }

  uploadSeal(storeId: string, file: File): Observable<Store> {
    const body = new FormData();
    body.append('file', file);

    return this.http.patch<Store>(`${this.config.baseUrl}/stores/${storeId}/seal`, body);
  }

  remove(storeId: string): Observable<void> {
    return this.http.delete<void>(`${this.config.baseUrl}/stores/${storeId}`);
  }
}
