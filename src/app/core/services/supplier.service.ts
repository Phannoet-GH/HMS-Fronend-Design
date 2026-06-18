import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { API_BASE_URL } from '@core/api.config';
import { ApiResponse } from '@core/models/api-response.model';
import { Supplier } from '@core/models/supplier.model';

@Injectable({
    providedIn: 'root'
})
export class SupplierService {

    private readonly endpoint = `${API_BASE_URL}/suppliers`;

    constructor(private http: HttpClient) { }

    getAll(filters: {
        status?: string;
        category?: string;
    } = {}): Observable<Supplier[]> {

        let params = new HttpParams();

        if (filters.status) {
            params = params.set('status', filters.status);
        }

        if (filters.category) {
            params = params.set('category', filters.category);
        }

        return this.http
            .get<ApiResponse<Supplier[]>>(this.endpoint, { params })
            .pipe(map(res => res.data));
    }

    getById(id: string): Observable<Supplier> {
        return this.http
            .get<ApiResponse<Supplier>>(`${this.endpoint}/${id}`)
            .pipe(map(res => res.data));
    }
}