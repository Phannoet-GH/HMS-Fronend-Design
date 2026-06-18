import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api.config';
import { Employee } from '../models/employee.model';

@Injectable({
    providedIn: 'root'
})
export class EmployeeService {
    private readonly apiUrl = `${API_BASE_URL}/employees`;

    constructor(private http: HttpClient) { }

    /** 💼 Fetch all employees (backend can populate department/user info) */
    getEmployees(): Observable<Employee[]> {
        return this.http.get<Employee[]>(this.apiUrl);
    }

    /** 🔍 Fetch a specific employee details */
    getEmployeeById(id: string): Observable<Employee> {
        return this.http.get<Employee>(`${this.apiUrl}/${id}`);
    }

    /** 🚀 Get employee profile mapped to the logged-in user account ID */
    getProfileByUserId(userId: string): Observable<Employee> {
        return this.http.get<Employee>(`${this.apiUrl}/user/${userId}`);
    }

    /** ➕ Create/Register a new employee profile */
    createEmployee(employeeData: Employee): Observable<Employee> {
        return this.http.post<Employee>(this.apiUrl, employeeData);
    }

    /** ✏️ Update employee profile details or change work status */
    updateEmployee(id: string, employeeData: Partial<Employee>): Observable<Employee> {
        return this.http.put<Employee>(`${this.apiUrl}/${id}`, employeeData);
    }

    /** ❌ Delete an employee record */
    deleteEmployee(id: string): Observable<any> {
        return this.http.delete<any>(`${this.apiUrl}/${id}`);
    }
}