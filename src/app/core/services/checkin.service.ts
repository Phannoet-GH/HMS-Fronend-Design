import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { ApiResponse } from '@core/models/api-response.model';
import { CheckIn, CheckInPayload, CheckInStatus } from '@core/models/checkin.model';
import { API_BASE_URL } from '@core/api.config';

export interface CheckInQueryParams {
    status?: CheckInStatus;
    bookingId?: string;
    roomId?: string;
}

@Injectable({ providedIn: 'root' })
export class CheckInService {
    private readonly endpoint = `${API_BASE_URL}/checkins`;

    constructor(private http: HttpClient) { }

    getAll(filters: CheckInQueryParams = {}): Observable<CheckIn[]> {
        let params = new HttpParams();
        if (filters.status) params = params.set('status', filters.status);
        if (filters.bookingId) params = params.set('bookingId', filters.bookingId);
        if (filters.roomId) params = params.set('roomId', filters.roomId);

        return this.http.get<ApiResponse<CheckIn[]>>(this.endpoint, { params }).pipe(
            map(res => res.data),
            catchError(err => {
                console.error('[CheckInService] getAll failed', err);
                return throwError(() => err);
            })
        );
    }

    getById(id: string): Observable<CheckIn> {
        return this.http.get<ApiResponse<CheckIn>>(`${this.endpoint}/${id}`).pipe(
            map(res => res.data),
            catchError(err => {
                console.error(`[CheckInService] getById(${id}) failed`, err);
                return throwError(() => err);
            })
        );
    }

    create(payload: CheckInPayload): Observable<CheckIn> {
        return this.http.post<ApiResponse<CheckIn>>(this.endpoint, payload).pipe(
            map(res => res.data),
            catchError(err => {
                console.error('[CheckInService] create failed', err);
                return throwError(() => err);
            })
        );
    }

    update(id: string, payload: Partial<CheckInPayload>): Observable<CheckIn> {
        return this.http.put<ApiResponse<CheckIn>>(`${this.endpoint}/${id}`, payload).pipe(
            map(res => res.data),
            catchError(err => {
                console.error(`[CheckInService] update(${id}) failed`, err);
                return throwError(() => err);
            })
        );
    }

    updateStatus(id: string, status: CheckInStatus): Observable<CheckIn> {
        return this.http.patch<ApiResponse<CheckIn>>(`${this.endpoint}/${id}/status`, { status }).pipe(
            map(res => res.data),
            catchError(err => {
                console.error(`[CheckInService] updateStatus(${id}) failed`, err);
                return throwError(() => err);
            })
        );
    }

    delete(id: string): Observable<void> {
        return this.http.delete<ApiResponse<null>>(`${this.endpoint}/${id}`).pipe(
            map(() => void 0),
            catchError(err => {
                console.error(`[CheckInService] delete(${id}) failed`, err);
                return throwError(() => err);
            })
        );
    }
}