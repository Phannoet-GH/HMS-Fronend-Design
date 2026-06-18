import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api.config';
import { CheckIn } from '../models/checkin.model';

@Injectable({
    providedIn: 'root'
})
export class CheckInService {
    private readonly apiUrl = `${API_BASE_URL}/checkins`;

    constructor(private http: HttpClient) { }

    /** 🗂️ Fetch all recorded front desk check-in transactions */
    getCheckIns(): Observable<CheckIn[]> {
        return this.http.get<CheckIn[]>(this.apiUrl);
    }

    /** 🔍 Fetch data details for a specific check-in session */
    getCheckInById(id: string): Observable<CheckIn> {
        return this.http.get<CheckIn>(`${this.apiUrl}/${id}`);
    }

    /** 🔑 Execute a new check-in transaction (assigns keys, records deposit) */
    createCheckIn(checkInData: CheckIn): Observable<CheckIn> {
        return this.http.post<CheckIn>(this.apiUrl, checkInData);
    }

    /** ✏️ Modify check-in parameters or append operational notes */
    updateCheckIn(id: string, checkInData: Partial<CheckIn>): Observable<CheckIn> {
        return this.http.put<CheckIn>(`${this.apiUrl}/${id}`, checkInData);
    }

    /** ❌ Cancel or delete a check-in transaction record */
    deleteCheckIn(id: string): Observable<any> {
        return this.http.delete<any>(`${this.apiUrl}/${id}`);
    }
}