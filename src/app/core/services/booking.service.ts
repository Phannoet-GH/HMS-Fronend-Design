import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { API_BASE_URL } from '@core/api.config';
import { ApiResponse } from '@core/models/api-response.model';
import { Booking, BookingPayload, BookingQueryParams } from '@core/models/booking.model';

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly baseUrl = `${API_BASE_URL}/bookings`;

  constructor(private http: HttpClient) { }

  getBookings(filters: BookingQueryParams = {}): Observable<Booking[]> {
    let params = new HttpParams();
    if (filters.status) params = params.set('status', filters.status);
    if (filters.room) params = params.set('room', filters.room);

    return this.http.get<ApiResponse<Booking[]>>(this.baseUrl, { params }).pipe(
      map(res => res.data),
      catchError(err => {
        console.error('[BookingService] getBookings failed', err);
        return throwError(() => err);
      })
    );
  }

  getBookingById(id: string): Observable<Booking> {
    return this.http.get<ApiResponse<Booking>>(`${this.baseUrl}/${id}`).pipe(
      map(res => res.data),
      catchError(err => {
        console.error(`[BookingService] getBookingById(${id}) failed`, err);
        return throwError(() => err);
      })
    );
  }

  createBooking(data: BookingPayload): Observable<Booking> {
    return this.http.post<ApiResponse<Booking>>(this.baseUrl, data).pipe(
      map(res => res.data),
      catchError(err => {
        console.error('[BookingService] createBooking failed', err);
        return throwError(() => err);
      })
    );
  }

  updateBooking(id: string, data: Partial<BookingPayload>): Observable<Booking> {
    return this.http.patch<ApiResponse<Booking>>(`${this.baseUrl}/${id}`, data).pipe(
      map(res => res.data),
      catchError(err => {
        console.error(`[BookingService] updateBooking(${id}) failed`, err);
        return throwError(() => err);
      })
    );
  }

  updateBookingStatus(id: string, status: string): Observable<Booking> {
    return this.http.patch<ApiResponse<Booking>>(`${this.baseUrl}/${id}/status`, { status }).pipe(
      map(res => res.data),
      catchError(err => {
        console.error(`[BookingService] updateBookingStatus(${id}) failed`, err);
        return throwError(() => err);
      })
    );
  }

  deleteBooking(id: string): Observable<void> {
    return this.http.delete<ApiResponse<null>>(`${this.baseUrl}/${id}`).pipe(
      map(() => void 0),
      catchError(err => {
        console.error(`[BookingService] deleteBooking(${id}) failed`, err);
        return throwError(() => err);
      })
    );
  }
}