import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { API_BASE_URL } from '../api.config';
import { ApiResponse } from './room.service';

export type User = {
  _id: string;
  username: string;
  email: string;
  roleId: string;
};

export type UserPayload = {
  username: string;
  email: string;
  password?: string;
  roleId: string;
};

export type UserFilters = {
  search?: string;
  roleId?: string;
  skip?: number;
  limit?: number;
};

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly baseUrl = `${API_BASE_URL}/users`;

  constructor(private http: HttpClient) {}

  createUser(data: UserPayload & { password: string }) {
    return this.http.post<ApiResponse<User>>(this.baseUrl, data);
  }

  getCurrentUser() {
    return this.http.get<ApiResponse<User>>(`${this.baseUrl}/current`);
  }

  getUsers(filters?: UserFilters) {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.roleId) params.append('roleId', filters.roleId);
    if (filters?.skip !== undefined) params.append('skip', String(filters.skip));
    if (filters?.limit !== undefined) params.append('limit', String(filters.limit));

    const queryString = params.toString();
    const url = queryString ? `${this.baseUrl}?${queryString}` : this.baseUrl;

    return this.http.get<ApiResponse<{ users: User[]; total: number }>>(url);
  }

  getUserById(id: string) {
    return this.http.get<ApiResponse<User>>(`${this.baseUrl}/${id}`);
  }

  updateUser(id: string, data: Partial<Omit<UserPayload, 'password'>>) {
    return this.http.patch<ApiResponse<User>>(`${this.baseUrl}/${id}`, data);
  }

  updateUserPassword(id: string, data: { currentPassword: string; newPassword: string }) {
    return this.http.patch<ApiResponse<User>>(`${this.baseUrl}/${id}/password`, data);
  }

  deleteUser(id: string) {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
