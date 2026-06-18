import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { API_BASE_URL } from '@core/api.config';
import { ApiResponse } from '@core/models/api-response.model';
import { ServiceRequest } from '@core/models/service-request.model';

@Injectable({
    providedIn: 'root'
})
export class ServiceRequestService {
    private readonly endpoint = `${API_BASE_URL}/service-requests`;

    constructor(private http: HttpClient) { }

    // 🟢 Fetch list with filters
    getAll(filters: { status?: string; priority?: string; type?: string; } = {}): Observable<ServiceRequest[]> {
        let params = new HttpParams();
        if (filters.status) params = params.set('status', filters.status);
        if (filters.priority) params = params.set('priority', filters.priority);
        if (filters.type) params = params.set('type', filters.type);

        return this.http.get<ApiResponse<ServiceRequest[]>>(this.endpoint, { params }).pipe(
            map(res => res.data ?? [])
        );
    }

    // 🟢 Fetch a single request
    getById(id: string): Observable<ServiceRequest> {
        return this.http.get<ApiResponse<ServiceRequest>>(`${this.endpoint}/${id}`).pipe(
            map(res => res.data)
        );
    }

    // 🟢 Create a new request
    create(data: Partial<ServiceRequest>): Observable<ServiceRequest> {
        return this.http.post<ApiResponse<ServiceRequest>>(this.endpoint, data).pipe(
            map(res => res.data)
        );
    }

    // 🟢 Update existing request
    update(id: string, data: Partial<ServiceRequest>): Observable<ServiceRequest> {
        return this.http.put<ApiResponse<ServiceRequest>>(`${this.endpoint}/${id}`, data).pipe(
            map(res => res.data)
        );
    }

    // 🟢 Delete request
    delete(id: string): Observable<void> {
        return this.http.delete<ApiResponse<void>>(`${this.endpoint}/${id}`).pipe(
            map(() => undefined)
        );
    }
}