import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { API_BASE_URL } from '../api.config';
import { ApiResponse } from './room.service';

export type Guest = {
  _id: string;
  fullName: string;
  email?: string;
  phone: string;
  idNumber?: string;
  address?: string;
  createdAt?: string;
};

export type GuestPayload = Omit<Guest, '_id' | 'createdAt'>;

@Injectable({ providedIn: 'root' })
export class GuestService {
  private readonly baseUrl = `${API_BASE_URL}/guests`;

  constructor(private http: HttpClient) {}

  getGuests(search = '') {
    const params = search ? new HttpParams().set('search', search) : undefined;
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
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
