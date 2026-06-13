import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { ApiResponse } from '@core/models/api-response.model';
import { InventoryItem } from '@core/models/inventory.model';
import { API_BASE_URL } from '@core/api.config';

@Injectable({ providedIn: 'root' })
export class InventoryService {
    private readonly endpoint = `${API_BASE_URL}/inventory`;

    constructor(private http: HttpClient) { }

    getAll(filters: { status?: string; category?: string } = {}): Observable<InventoryItem[]> {
        let params = new HttpParams();
        if (filters.status) params = params.set('status', filters.status);
        if (filters.category) params = params.set('category', filters.category);

        return this.http.get<ApiResponse<InventoryItem[]>>(this.endpoint, { params }).pipe(
            map(res => res.data),
            catchError(err => {
                console.error('[InventoryService] getAll failed', err);
                return throwError(() => err);
            })
        );
    }
    
}