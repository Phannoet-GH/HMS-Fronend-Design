import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { API_BASE_URL } from '@core/api.config';
import { ApiResponse } from '@core/models/api-response.model';
import {
  Invoice,
  InvoicePayload,
  InvoiceQueryParams,
  InvoiceListResponse,
  InvoiceStatus,
  UpdateInvoiceStatusPayload
} from '@core/models/invoice.model';

@Injectable({ providedIn: 'root' })
export class InvoiceService {
  private readonly baseUrl = `${API_BASE_URL}/invoices`;

  constructor(private http: HttpClient) { }

  getAll(filters: InvoiceQueryParams = {}): Observable<InvoiceListResponse> {
    let params = new HttpParams();
    if (filters.status) params = params.set('status', filters.status);
    if (filters.bookingId) params = params.set('bookingId', filters.bookingId);
    if (filters.skip !== undefined) params = params.set('skip', String(filters.skip));
    if (filters.limit !== undefined) params = params.set('limit', String(filters.limit));

    return this.http.get<ApiResponse<InvoiceListResponse>>(this.baseUrl, { params }).pipe(
      map(res => res.data),
      catchError(err => {
        console.error('[InvoiceService] getAll failed', err);
        return throwError(() => err);
      })
    );
  }

  getAllInvoices(filters: InvoiceQueryParams = {}): Observable<Invoice[]> {
    return this.getAll(filters).pipe(map(res => res.invoices));
  }

  getById(id: string): Observable<Invoice> {
    return this.http.get<ApiResponse<Invoice>>(`${this.baseUrl}/${id}`).pipe(
      map(res => res.data),
      catchError(err => {
        console.error(`[InvoiceService] getById(${id}) failed`, err);
        return throwError(() => err);
      })
    );
  }

  create(data: InvoicePayload): Observable<Invoice> {
    return this.http.post<ApiResponse<Invoice>>(this.baseUrl, data).pipe(
      map(res => res.data),
      catchError(err => {
        console.error('[InvoiceService] create failed', err);
        return throwError(() => err);
      })
    );
  }

  update(id: string, data: Partial<InvoicePayload>): Observable<Invoice> {
    return this.http.put<ApiResponse<Invoice>>(`${this.baseUrl}/${id}`, data).pipe(
      map(res => res.data),
      catchError(err => {
        console.error(`[InvoiceService] update(${id}) failed`, err);
        return throwError(() => err);
      })
    );
  }

  updateStatus(id: string, payload: UpdateInvoiceStatusPayload): Observable<Invoice> {
    return this.http.patch<ApiResponse<Invoice>>(`${this.baseUrl}/${id}/status`, payload).pipe(
      map(res => res.data),
      catchError(err => {
        console.error(`[InvoiceService] updateStatus(${id}) failed`, err);
        return throwError(() => err);
      })
    );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<ApiResponse<null>>(`${this.baseUrl}/${id}`).pipe(
      map(() => void 0),
      catchError(err => {
        console.error(`[InvoiceService] delete(${id}) failed`, err);
        return throwError(() => err);
      })
    );
  }
}
