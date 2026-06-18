import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { ApiResponse } from '@core/models/api-response.model';
import { API_BASE_URL } from '@core/api.config';
import { RoomServiceOrder, RoomServicePayload, RoomServiceQueryParams, RoomServiceStatus } from '@core/models/room-service.model';
@Injectable({ providedIn: 'root' })
export class RoomServiceService {
    private readonly endpoint = `${API_BASE_URL}/room-services`;

    constructor(private http: HttpClient) { }

    getAll(filters: RoomServiceQueryParams = {}): Observable<RoomServiceOrder[]> {
        let params = new HttpParams();
        if (filters.status) params = params.set('status', filters.status);
        if (filters.roomId) params = params.set('roomId', filters.roomId);

        return this.http.get<ApiResponse<RoomServiceOrder[]>>(this.endpoint, { params }).pipe(
            map(res => res.data),
            catchError(err => {
                console.error('[RoomServiceService] getAll failed', err);
                return throwError(() => err);
            })
        );
    }

    getById(id: string): Observable<RoomServiceOrder> {
        return this.http.get<ApiResponse<RoomServiceOrder>>(`${this.endpoint}/${id}`).pipe(
            map(res => res.data),
            catchError(err => {
                console.error(`[RoomServiceService] getById(${id}) failed`, err);
                return throwError(() => err);
            })
        );
    }

    create(payload: RoomServicePayload): Observable<RoomServiceOrder> {
        return this.http.post<ApiResponse<RoomServiceOrder>>(this.endpoint, payload).pipe(
            map(res => res.data),
            catchError(err => {
                console.error('[RoomServiceService] create failed', err);
                return throwError(() => err);
            })
        );
    }

    update(id: string, payload: Partial<RoomServicePayload>): Observable<RoomServiceOrder> {
        return this.http.put<ApiResponse<RoomServiceOrder>>(`${this.endpoint}/${id}`, payload).pipe(
            map(res => res.data),
            catchError(err => {
                console.error(`[RoomServiceService] update(${id}) failed`, err);
                return throwError(() => err);
            })
        );
    }

    updateStatus(id: string, status: RoomServiceStatus): Observable<RoomServiceOrder> {
        return this.http.patch<ApiResponse<RoomServiceOrder>>(`${this.endpoint}/${id}/status`, { status }).pipe(
            map(res => res.data),
            catchError(err => {
                console.error(`[RoomServiceService] updateStatus(${id}) failed`, err);
                return throwError(() => err);
            })
        );
    }

    delete(id: string): Observable<void> {
        return this.http.delete<ApiResponse<null>>(`${this.endpoint}/${id}`).pipe(
            map(() => void 0),
            catchError(err => {
                console.error(`[RoomServiceService] delete(${id}) failed`, err);
                return throwError(() => err);
            })
        );
    }
}