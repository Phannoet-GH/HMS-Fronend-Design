import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { API_BASE_URL } from '../api.config';

export type AuthUser = {
  _id: string;
  username: string;
  email: string;
  roleId: string;
};

export type AuthResponse = {
  user: AuthUser;
  token: string;
};

@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly baseUrl = `${API_BASE_URL}/auth`;

  constructor(private http: HttpClient) {}

  register(data: { username: string; email: string; password: string; roleId?: string }) {
    return this.http.post<AuthResponse>(`${this.baseUrl}/register`, data);
  }

  login(data: { email: string; password: string }) {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, data);
  }

  saveToken(token: string) {
    localStorage.setItem('token', token);
  }

  getToken() {
    return localStorage.getItem('token');
  }

  logout() {
    localStorage.removeItem('token');
  }

  isAuthenticated() {
    return !!this.getToken();
  }

  getCurrentUser(): Pick<AuthUser, 'username' | 'roleId'> | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        username: payload.email || 'User',
        roleId: payload.roleId
      };
    } catch {
      return null;
    }
  }
}
