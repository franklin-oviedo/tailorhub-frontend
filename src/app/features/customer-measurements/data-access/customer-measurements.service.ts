import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { CustomerMeasurement } from '../../customers/data-access/customers.service';
import { ApiConfigService } from '../../../core/services/api-config.service';

interface MeasurementsPaginatedResponse {
  data: CustomerMeasurement[];
}

interface MeasurementsCollectionResponse {
  items: CustomerMeasurement[];
}

type MeasurementsApiResponse =
  | CustomerMeasurement[]
  | MeasurementsPaginatedResponse
  | MeasurementsCollectionResponse;

export interface CustomerMeasurementsQuery {
  page?: number;
  limit?: number;
  search?: string;
}

@Injectable({ providedIn: 'root' })
export class CustomerMeasurementsService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ApiConfigService);

  list(query: CustomerMeasurementsQuery = {}): Observable<CustomerMeasurement[]> {
    const params = Object.fromEntries(
      Object.entries(query).filter(([, value]) => value !== undefined && value !== null && value !== '')
    );

    return this.http
      .get<MeasurementsApiResponse>(`${this.config.baseUrl}/customer/customer-measurements`, {
        params: params as never,
      })
      .pipe(map((response) => this.normalizeResponse(response)));
  }

  private normalizeResponse(response: MeasurementsApiResponse): CustomerMeasurement[] {
    if (Array.isArray(response)) {
      return response;
    }

    if ('data' in response && Array.isArray(response.data)) {
      return response.data;
    }

    if ('items' in response && Array.isArray(response.items)) {
      return response.items;
    }

    throw new Error('Formato inesperado al cargar medidas de clientes.');
  }
}
