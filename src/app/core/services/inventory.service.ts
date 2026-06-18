import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { ApiResponse } from '@core/models/api-response.model';
import { InventoryItem } from '@core/models/inventory.model';
import { API_BASE_URL } from '@core/api.config';

@Injectable({
    providedIn: 'root'
})
export class InventoryService {

    private readonly endpoint = `${API_BASE_URL}/inventory`;

    constructor(private http: HttpClient) { }

    getAll(filters: {
        status?: string;
        category?: string;
        search?: string;
    } = {}): Observable<InventoryItem[]> {

        let params = new HttpParams();

        if (filters.status) {
            params = params.set('status', filters.status);
        }

        if (filters.category) {
            params = params.set('category', filters.category);
        }

        if (filters.search) {
            params = params.set('search', filters.search);
        }

        return this.http
            .get<ApiResponse<InventoryItem[]>>(this.endpoint, { params })
            .pipe(
                map(res => res.data),
                catchError(this.handleError)
            );
    }

    getById(id: string): Observable<InventoryItem> {
        return this.http
            .get<ApiResponse<InventoryItem>>(`${this.endpoint}/${id}`)
            .pipe(
                map(res => res.data),
                catchError(this.handleError)
            );
    }

    create(item: Partial<InventoryItem>): Observable<InventoryItem> {
        return this.http
            .post<ApiResponse<InventoryItem>>(this.endpoint, item)
            .pipe(
                map(res => res.data),
                catchError(this.handleError)
            );
    }

    update(id: string, item: Partial<InventoryItem>): Observable<InventoryItem> {
        return this.http
            .put<ApiResponse<InventoryItem>>(`${this.endpoint}/${id}`, item)
            .pipe(
                map(res => res.data),
                catchError(this.handleError)
            );
    }

    delete(id: string): Observable<void> {
        return this.http
            .delete<ApiResponse<void>>(`${this.endpoint}/${id}`)
            .pipe(
                map(() => void 0),
                catchError(this.handleError)
            );
    }

    getLowStock(): Observable<InventoryItem[]> {
        return this.http
            .get<ApiResponse<InventoryItem[]>>(
                `${this.endpoint}?status=low-stock`
            )
            .pipe(
                map(res => res.data),
                catchError(this.handleError)
            );
    }

    private handleError(error: any) {
        console.error('[InventoryService] Error:', error);
        return throwError(() => error);
    }
}