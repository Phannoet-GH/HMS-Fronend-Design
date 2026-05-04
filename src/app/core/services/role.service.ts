import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class RoleService {

  getRole(): string | null {
    const token = localStorage.getItem('token');
    if (!token) return null;

    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.roleId;
  }

  isAdmin() {
    return this.getRole() === 'r1';
  }

  isReception() {
    return this.getRole() === 'r2';
  }

  isHousekeeping() {
    return this.getRole() === 'r3';
  }

  isAccountant() {
    return this.getRole() === 'r5';
  }
}