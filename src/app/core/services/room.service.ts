import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { API_BASE_URL } from '../api.config';

export type RoomStatus = 'available' | 'occupied' | 'maintenance' | 'reserved';
export type RoomType = 'single' | 'double' | 'suite' | 'deluxe';

export type Room = {
  _id: string;
  roomNumber: string;
  type: RoomType;
  pricePerNight: number;
  capacity: number;
  status: RoomStatus;
  description?: string;
};

export type ApiResponse<T> = {
  success?: boolean;
  message: string;
  data: T;
};

export type RoomPayload = Omit<Room, '_id'>;
export type RoomFilters = {
  status?: RoomStatus;
  type?: RoomType;
};

@Injectable({ providedIn: 'root' })
export class RoomService {
  private readonly baseUrl = `${API_BASE_URL}/rooms`;

  constructor(private http: HttpClient) {}

  getRooms(filters?: RoomFilters) {
    return this.http.get<ApiResponse<Room[]>>(this.baseUrl, {
      params: {
        ...(filters?.status ? { status: filters.status } : {}),
        ...(filters?.type ? { type: filters.type } : {})
      }
    });
  }

  getRoomById(id: string) {
    return this.http.get<ApiResponse<Room>>(`${this.baseUrl}/${id}`);
  }

  createRoom(data: RoomPayload) {
    return this.http.post<ApiResponse<Room>>(this.baseUrl, data);
  }

  updateRoom(id: string, data: RoomPayload) {
    return this.http.patch<ApiResponse<Room>>(`${this.baseUrl}/${id}`, data);
  }

  deleteRoom(id: string) {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
