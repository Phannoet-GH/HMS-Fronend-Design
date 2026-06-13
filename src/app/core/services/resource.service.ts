import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { ApiResponse } from '@core/models/api-response.model';
import { API_BASE_URL } from '@core/api.config';

export type ResourceRecord = {
  _id?: string;
  [key: string]: any;
};
@Injectable({ providedIn: 'root' })
export class ResourceService {
  private readonly base = API_BASE_URL;

  constructor(private http: HttpClient) { }

  list(endpoint: string): Observable<ResourceRecord[]> {
    return this.http.get<ApiResponse<ResourceRecord[]>>(`${this.base}/${endpoint}`).pipe(
      map(res => res.data),
      catchError(err => throwError(() => err))
    );
  }

  create(endpoint: string, payload: ResourceRecord): Observable<ResourceRecord> {
    return this.http.post<ApiResponse<ResourceRecord>>(`${this.base}/${endpoint}`, payload).pipe(
      map(res => res.data),
      catchError(err => throwError(() => err))
    );
  }

  update(endpoint: string, id: string, payload: ResourceRecord): Observable<ResourceRecord> {
    return this.http.put<ApiResponse<ResourceRecord>>(`${this.base}/${endpoint}/${id}`, payload).pipe(
      map(res => res.data),
      catchError(err => throwError(() => err))
    );
  }

  delete(endpoint: string, id: string): Observable<void> {
    return this.http.delete<ApiResponse<null>>(`${this.base}/${endpoint}/${id}`).pipe(
      map(() => void 0),
      catchError(err => throwError(() => err))
    );
  }
}