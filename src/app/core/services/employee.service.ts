import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { Employee, EmployeeShift, EmployeeStatus } from '@core/models/employee.model';
import { ApiResponse } from '@core/models/api-response.model';
import { API_BASE_URL } from '@core/api.config';

export interface EmployeeQueryParams {
    status?: EmployeeStatus;
    department?: string;
    shift?: EmployeeShift;
}

@Injectable({ providedIn: 'root' })
export class EmployeeService {
    private readonly endpoint = `${API_BASE_URL}/employees`;

    constructor(private http: HttpClient) { }

    getAll(filters: EmployeeQueryParams = {}): Observable<Employee[]> {
        let params = new HttpParams();
        // Temporary test in fetchFormOptions
        if (filters.status) params = params.set('status', filters.status);
        if (filters.department) params = params.set('department', filters.department);
        if (filters.shift) params = params.set('shift', filters.shift);

        return this.http.get<ApiResponse<Employee[]>>(this.endpoint, { params }).pipe(
            map(res => res.data),
            catchError(err => {
                console.error('[EmployeeService] getAll failed', err);
                return throwError(() => err);
            })
        );
    }

    getById(id: string): Observable<Employee> {
        return this.http.get<ApiResponse<Employee>>(`${this.endpoint}/${id}`).pipe(
            map(res => res.data),
            catchError(err => {
                console.error(`[EmployeeService] getById(${id}) failed`, err);
                return throwError(() => err);
            })
        );
    }

    create(payload: Omit<Employee, '_id' | 'createdAt' | 'updatedAt'>): Observable<Employee> {
        return this.http.post<ApiResponse<Employee>>(this.endpoint, payload).pipe(
            map(res => res.data),
            catchError(err => {
                console.error('[EmployeeService] create failed', err);
                return throwError(() => err);
            })
        );
    }

    update(id: string, payload: Partial<Omit<Employee, '_id' | 'createdAt' | 'updatedAt'>>): Observable<Employee> {
        return this.http.put<ApiResponse<Employee>>(`${this.endpoint}/${id}`, payload).pipe(
            map(res => res.data),
            catchError(err => {
                console.error(`[EmployeeService] update(${id}) failed`, err);
                return throwError(() => err);
            })
        );
    }

    delete(id: string): Observable<void> {
        return this.http.delete<ApiResponse<null>>(`${this.endpoint}/${id}`).pipe(
            map(() => void 0),
            catchError(err => {
                console.error(`[EmployeeService] delete(${id}) failed`, err);
                return throwError(() => err);
            })
        );
    }
}