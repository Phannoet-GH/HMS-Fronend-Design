import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { API_BASE_URL } from '../api.config';
import { ApiResponse } from '@core/models/api-response.model';

export type Guest = {
  _id: string;
  fullName: string;
  email?: string;
  phone: string;
  idType: 'passport' | 'national-id' | 'driver-license' | 'other';
  idNumber?: string;
  nationality?: string;
  address?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type GuestPayload = Omit<Guest, '_id' | 'createdAt' | 'updatedAt'>;

@Injectable({ providedIn: 'root' })
export class GuestService {
  private readonly baseUrl = `${API_BASE_URL}/guests`;

  constructor(private http: HttpClient) { }

  getGuests(search = '') {
    const params = search ? new HttpParams().set('search', search) : {};
    return this.http.get<ApiResponse<Guest[]>>(this.baseUrl, { params });
  }

  getGuestById(id: string) {
    return this.http.get<ApiResponse<Guest>>(`${this.baseUrl}/${id}`);
  }

  createGuest(data: GuestPayload) {
    return this.http.post<ApiResponse<Guest>>(this.baseUrl, data);
  }

  updateGuest(id: string, data: GuestPayload) {
    return this.http.patch<ApiResponse<Guest>>(`${this.baseUrl}/${id}`, data);
  }

  deleteGuest(id: string) {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`);
  }
}