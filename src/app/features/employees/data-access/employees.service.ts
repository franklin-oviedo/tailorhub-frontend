import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { UserRole } from '../../../core/models/domain.models';
import { ApiConfigService } from '../../../core/services/api-config.service';

export interface EmployeeUserRef {
  id: string;
  role: UserRole;
}

export interface EmployeeStoreRef {
  id: string;
}

export interface EmployeeRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  active: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  store: EmployeeStoreRef | null;
  user: EmployeeUserRef | null;
}

export interface CreateEmployeePayload {
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
  active?: boolean;
  storeId?: string;
  userId?: string;
}

export interface UpdateEmployeePayload {
  name?: string;
  email?: string;
  phone?: string;
  notes?: string;
  active?: boolean;
  storeId?: string;
  userId?: string;
}

export interface DeleteEmployeeResponse {
  message: string;
}

export interface CreateEmployeeInvitationPayload {
  email: string;
  expiresInHours?: number;
}

export interface UserInvitationResponse {
  id?: string;
  email?: string;
  role?: UserRole;
  invitationToken?: string;
  invitationLink?: string;
  status?: string;
  expiresAt?: string;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class EmployeesService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ApiConfigService);

  listAll(): Observable<EmployeeRecord[]> {
    return this.http.get<EmployeeRecord[]>(`${this.config.baseUrl}/employee`);
  }

  detail(employeeId: string): Observable<EmployeeRecord> {
    return this.http.get<EmployeeRecord>(`${this.config.baseUrl}/employee/${employeeId}`);
  }

  create(payload: CreateEmployeePayload): Observable<EmployeeRecord> {
    return this.http.post<EmployeeRecord>(`${this.config.baseUrl}/employee`, payload);
  }

  update(employeeId: string, payload: UpdateEmployeePayload): Observable<EmployeeRecord> {
    return this.http.patch<EmployeeRecord>(`${this.config.baseUrl}/employee/${employeeId}`, payload);
  }

  remove(employeeId: string): Observable<DeleteEmployeeResponse> {
    return this.http.delete<DeleteEmployeeResponse>(`${this.config.baseUrl}/employee/${employeeId}`);
  }

  createInvitation(payload: CreateEmployeeInvitationPayload): Observable<UserInvitationResponse> {
    return this.http.post<UserInvitationResponse>(`${this.config.baseUrl}/employee/invitations`, payload);
  }
}
