import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { API_BASE_URL } from '../api.config';
import { ApiResponse, Room } from './room.service';

export type Booking = {
  _id: string;
  guest: {
    fullName: string;
    email?: string;
    phone: string;
  };
  room: Room;
  checkInDate: string;
  checkOutDate: string;
  status: string;
  totalAmount: number;
};

export type BookingPayload = {
  guest: {
    fullName: string;
    email?: string;
    phone: string;
    idNumber?: string;
    address?: string;
  };
  roomId: string;
  checkInDate: string;
  checkOutDate: string;
  status?: string;
};

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly baseUrl = `${API_BASE_URL}/bookings`;

  constructor(private http: HttpClient) {}

  getBookings() {
    return this.http.get<ApiResponse<Booking[]>>(this.baseUrl);
  }

  createBooking(data: BookingPayload) {
    return this.http.post<ApiResponse<Booking>>(this.baseUrl, data);
  }

  updateBookingStatus(id: string, status: string) {
    return this.http.patch<ApiResponse<Booking>>(`${this.baseUrl}/${id}/status`, { status });
  }
}
