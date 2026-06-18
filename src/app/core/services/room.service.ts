import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { API_BASE_URL } from '../api.config';
import { Room } from '../models/room.model';

@Injectable({
  providedIn: 'root'
})
export class RoomService {
  private readonly apiUrl = `${API_BASE_URL}/rooms`;

  constructor(private http: HttpClient) { }

  /** * Internal helper to unwrap backend response objects 
   */
  private unwrap<T>(res: any): T {
    return (res.data || res.rooms || res) as T;
  }

  /** 🛏️ Fetch rooms with optional status/type query filtering */
  getRooms(filters?: Partial<Pick<Room, 'status' | 'type' | 'floorNumber'>>): Observable<Room[]> {
    let params = new HttpParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params = params.set(key, String(value));
        }
      });
    }
    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map(res => this.unwrap<Room[]>(res) || []) // 🟢 Fallback to [] if unwrap returns null/undefined
    );
  }

  /** 🔍 Fetch an individual room configuration profile */
  getRoomById(id: string): Observable<Room> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(res => this.unwrap<Room>(res))
    );
  }

  /** ➕ Create/Register a new room unit into inventory */
  createRoom(roomData: Room): Observable<Room> {
    return this.http.post<any>(this.apiUrl, roomData).pipe(
      map(res => this.unwrap<Room>(res))
    );
  }

  /** 🛠️ Fast property patcher for status toggles */
  updateRoomStatus(id: string, status: Room['status']): Observable<Room> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/status`, { status }).pipe(
      map(res => this.unwrap<Room>(res))
    );
  }

  /** ✏️ Modify comprehensive room parameters */
  updateRoom(id: string, roomData: Partial<Room>): Observable<Room> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, roomData).pipe(
      map(res => this.unwrap<Room>(res))
    );
  }

  /** ❌ Remove a room registry entry */
  deleteRoom(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}