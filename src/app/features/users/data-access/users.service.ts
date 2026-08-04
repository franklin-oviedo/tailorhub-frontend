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

  update(userId: string, payload: Partial<User>): Observable<User> {
    return this.http.patch<User>(`${this.config.baseUrl}/users/${userId}`, payload);
  }

  remove(userId: string): Observable<void> {
    return this.http.delete<void>(`${this.config.baseUrl}/users/${userId}`);
  }
}
