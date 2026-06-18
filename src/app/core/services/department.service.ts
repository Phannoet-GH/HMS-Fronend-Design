import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { Department, DepartmentFormPayload } from '../models/department.model';
import { API_BASE_URL } from '../api.config';

interface MongoResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}

@Injectable({
    providedIn: 'root'
})
export class DepartmentService {
    // Update this to match your environment variables or target local server port setup
    private readonly apiUrl = `${API_BASE_URL}/departments`;

    constructor(private http: HttpClient) { }

    /**
     * Retrieve all departmental node arrays with populated manager records
     */
    getDepartments(): Observable<MongoResponse<Department[]>> {
        return this.http.get<MongoResponse<Department[]>>(this.apiUrl).pipe(
            catchError(this.handleBackendError)
        );
    }

    /**
     * Fetch a specific department by its database primary ID key
     */
    getDepartmentById(id: string): Observable<MongoResponse<Department>> {
        return this.http.get<MongoResponse<Department>>(`${this.apiUrl}/${id}`).pipe(
            catchError(this.handleBackendError)
        );
    }

    /**
     * Create a new organizational unit record
     */
    createDepartment(payload: DepartmentFormPayload): Observable<MongoResponse<Department>> {
        return this.http.post<MongoResponse<Department>>(this.apiUrl, payload).pipe(
            catchError(this.handleBackendError)
        );
    }

    /**
     * Update operational parameters on an existing department
     */
    updateDepartment(id: string, payload: DepartmentFormPayload): Observable<MongoResponse<Department>> {
        return this.http.put<MongoResponse<Department>>(`${this.apiUrl}/${id}`, payload).pipe(
            catchError(this.handleBackendError)
        );
    }

    /**
     * Remove a department from active system tracking
     */
    deleteDepartment(id: string): Observable<MongoResponse<null>> {
        return this.http.delete<MongoResponse<null>>(`${this.apiUrl}/${id}`).pipe(
            catchError(this.handleBackendError)
        );
    }

    /**
     * Global catch exception router pipeline processor 
     */
    private handleBackendError(error: HttpErrorResponse): Observable<never> {
        let readableMessage = 'An error occurred during communication with the server.';

        if (error.error && error.error.message) {
            // Pulls custom validation error strings thrown directly from your Mongoose schema
            readableMessage = error.error.message;
        } else {
            readableMessage = `Server communication failure. Status: ${error.status}`;
        }

        return throwError(() => new Error(readableMessage));
    }
}