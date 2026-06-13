import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { API_BASE_URL } from '@core/api.config';
import { Room, RoomStatus, RoomQueryParams } from '@core/models/room.model';
import { ApiResponse } from '@core/models/api-response.model';

@Injectable({ providedIn: 'root' })
export class RoomService {
  private readonly endpoint = `${API_BASE_URL}/rooms`;

  constructor(private http: HttpClient) { }

  getAll(filters: RoomQueryParams = {}): Observable<Room[]> {
    let params = new HttpParams();
    if (filters.status) params = params.set('status', filters.status);
    if (filters.type) params = params.set('type', filters.type);
    if (filters.capacity) params = params.set('capacity', String(filters.capacity));
    if (filters.minPrice) params = params.set('minPrice', String(filters.minPrice));
    if (filters.maxPrice) params = params.set('maxPrice', String(filters.maxPrice));

    return this.http.get<ApiResponse<Room[]>>(this.endpoint, { params }).pipe(
      map(res => res.data),
      catchError(err => {
        console.error('[RoomService] getAll failed', err);
        return throwError(() => err);
      })
    );
  }

  getById(id: string): Observable<Room> {
    return this.http.get<ApiResponse<Room>>(`${this.endpoint}/${id}`).pipe(
      map(res => res.data),
      catchError(err => {
        console.error(`[RoomService] getById(${id}) failed`, err);
        return throwError(() => err);
      })
    );
  }

  create(payload: Omit<Room, '_id' | 'createdAt' | 'updatedAt'>): Observable<Room> {
    return this.http.post<ApiResponse<Room>>(this.endpoint, payload).pipe(
      map(res => res.data),
      catchError(err => {
        console.error('[RoomService] create failed', err);
        return throwError(() => err);
      })
    );
  }

  update(id: string, payload: Partial<Omit<Room, '_id' | 'createdAt' | 'updatedAt'>>): Observable<Room> {
    return this.http.put<ApiResponse<Room>>(`${this.endpoint}/${id}`, payload).pipe(
      map(res => res.data),
      catchError(err => {
        console.error(`[RoomService] update(${id}) failed`, err);
        return throwError(() => err);
      })
    );
  }

  updateStatus(id: string, status: RoomStatus): Observable<Room> {
    return this.http.patch<ApiResponse<Room>>(`${this.endpoint}/${id}/status`, { status }).pipe(
      map(res => res.data),
      catchError(err => {
        console.error(`[RoomService] updateStatus(${id}) failed`, err);
        return throwError(() => err);
      })
    );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<ApiResponse<null>>(`${this.endpoint}/${id}`).pipe(
      map(() => void 0),
      catchError(err => {
        console.error(`[RoomService] delete(${id}) failed`, err);
        return throwError(() => err);
      })
    );
  }
}

