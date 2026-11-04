import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { PaginatedResponse, User, UserRole } from '../../../core/models/domain.models';
import { ApiConfigService } from '../../../core/services/api-config.service';

export interface UsersQuery {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface CreateUserPayload {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role?: UserRole;
  storeId?: string;
}

export interface UpdateUserPayload {
  fullName?: string;
  email?: string;
  phone?: string;
  password?: string;
  role?: UserRole;
  storeId?: string;
  isActive?: boolean;
}

export interface DisableUserResponse {
  message: string;
}

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ApiConfigService);

  me(): Observable<User> {
    return this.http.get<User>(`${this.config.baseUrl}/users/me`);
  }

  list(query: UsersQuery = {}): Observable<PaginatedResponse<User>> {
    return this.http.get<PaginatedResponse<User>>(`${this.config.baseUrl}/users`, { params: query as never });
  } 

  detail(userId: string): Observable<User> {
    return this.http.get<User>(`${this.config.baseUrl}/users/${userId}`);
  }

  create(payload: CreateUserPayload): Observable<User> {
    return this.http.post<User>(`${this.config.baseUrl}/users`, payload);
  }

  update(userId: string, payload: UpdateUserPayload): Observable<User> {
    return this.http.patch<User>(`${this.config.baseUrl}/users/${userId}`, payload);
  }

  disable(userId: string): Observable<DisableUserResponse> {
    return this.http.patch<DisableUserResponse>(`${this.config.baseUrl}/users/${userId}/disable`, {});
  }
}
