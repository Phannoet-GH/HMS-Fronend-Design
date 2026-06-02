import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { API_BASE_URL } from '../api.config';

export type ApiResponse<T> = {
  success?: boolean;
  message: string;
  data: T;
};

export type ResourceRecord = Record<string, any> & {
  _id?: string;
  createdAt?: string;
  updatedAt?: string;
};

@Injectable({ providedIn: 'root' })
export class ResourceService {
  constructor(private http: HttpClient) {}

  list<T extends ResourceRecord>(endpoint: string) {
    return this.http.get<ApiResponse<T[]>>(`${API_BASE_URL}/${endpoint}`);
  }

  create<T extends ResourceRecord>(endpoint: string, data: T) {
    return this.http.post<ApiResponse<T>>(`${API_BASE_URL}/${endpoint}`, data);
  }

  update<T extends ResourceRecord>(endpoint: string, id: string, data: T) {
    return this.http.patch<ApiResponse<T>>(`${API_BASE_URL}/${endpoint}/${id}`, data);
  }

  delete(endpoint: string, id: string) {
    return this.http.delete<void>(`${API_BASE_URL}/${endpoint}/${id}`);
  }
}
