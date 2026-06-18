import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs';
import { API_BASE_URL } from '../api.config';
import { ApiResponse, Room } from './room.service';

export type BookingGuest = {
  fullName: string;
  email?: string;
  phone: string;
};

export type Booking = {
  _id: string;
  guest: BookingGuest;
  room: Room | null;
  checkInDate: string;
  checkOutDate: string;
  status: string;
  totalAmount: number;
  guestId?: BookingGuest;
  roomId?: Room | string | null;
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

  getBookings(filters?: { status?: string; room?: string; roomId?: string }) {
    let url = this.baseUrl;

    if (filters) {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.roomId || filters.room) params.append('roomId', filters.roomId || filters.room || '');
      const queryString = params.toString();
      if (queryString) url += '?' + queryString;
    }

    return this.http.get<ApiResponse<Booking[]>>(url).pipe(
      map((response) => ({
        ...response,
        data: Array.isArray(response.data) ? response.data.map((booking) => this.normalizeBooking(booking)) : []
      }))
    );
  }

  getBookingById(id: string) {
    return this.http.get<ApiResponse<Booking>>(`${this.baseUrl}/${id}`).pipe(
      map((response) => ({
        ...response,
        data: this.normalizeBooking(response.data)
      }))
    );
  }

  createBooking(data: BookingPayload) {
    return this.http.post<ApiResponse<Booking>>(this.baseUrl, data).pipe(
      map((response) => ({
        ...response,
        data: this.normalizeBooking(response.data)
      }))
    );
  }

  updateBooking(id: string, data: Partial<BookingPayload>) {
    return this.http.put<ApiResponse<Booking>>(`${this.baseUrl}/${id}`, data).pipe(
      map((response) => ({
        ...response,
        data: this.normalizeBooking(response.data)
      }))
    );
  }

  updateBookingStatus(id: string, status: string) {
    return this.http.patch<ApiResponse<Booking>>(`${this.baseUrl}/${id}/status`, { status }).pipe(
      map((response) => ({
        ...response,
        data: this.normalizeBooking(response.data)
      }))
    );
  }

  deleteBooking(id: string) {
    return this.http.delete<ApiResponse<null>>(`${this.baseUrl}/${id}`);
  }

  private normalizeBooking(booking: Booking): Booking {
    const roomId = booking.roomId;

    return {
      ...booking,
      guest: booking.guest || booking.guestId || { fullName: 'Guest unavailable', phone: '' },
      room: booking.room || (roomId && typeof roomId === 'object' ? roomId : null)
    };
  }
}
