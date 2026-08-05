import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Appointment, CreateAppointment, PaginatedResponse } from '../../../core/models/domain.models';
import { ApiConfigService } from '../../../core/services/api-config.service';

export interface AppointmentsQuery {
  page?: number;
  limit?: number;
  status?: Appointment['status'];
  from?: string;
  to?: string;
}

@Injectable({ providedIn: 'root' })
export class AppointmentsService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ApiConfigService);

  list(query: AppointmentsQuery = {}): Observable<PaginatedResponse<Appointment>> {
    return this.http.get<PaginatedResponse<Appointment>>(`${this.config.baseUrl}/appointments`, {
      params: query as never
    });
  }

  create(
    payload: CreateAppointment
  ): Observable<CreateAppointment> {
    return this.http.post<CreateAppointment>(`${this.config.baseUrl}/appointments`, payload);
  }

  detail(appointmentId: string): Observable<Appointment> {
    return this.http.get<Appointment>(`${this.config.baseUrl}/appointments/${appointmentId}`);
  }

  update(appointmentId: string, payload: Partial<Appointment>): Observable<Appointment> {
    return this.http.patch<Appointment>(`${this.config.baseUrl}/appointments/${appointmentId}`, payload);
  }

  remove(appointmentId: string): Observable<void> {
    return this.http.delete<void>(`${this.config.baseUrl}/appointments/${appointmentId}`);
  }
}
