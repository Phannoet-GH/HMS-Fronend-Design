import { Injectable } from '@angular/core';

export const ROLES = {
  ADMIN: 'r1',
  RECEPTION: 'r2',
  HOUSEKEEPING: 'r3',
  GUEST: 'r4',
  ACCOUNTANT: 'r5'
} as const;

export type RoleType = typeof ROLES[keyof typeof ROLES];

export interface RoleConfig {
  id: string;
  name: string;
  displayName: string;
  defaultRoute: string;
  description: string;
}

@Injectable({ providedIn: 'root' })
export class RoleService {

  private roleConfigs: Map<string, RoleConfig> = new Map([
    [ROLES.ADMIN, {
      id: ROLES.ADMIN,
      name: 'Admin',
      displayName: 'Administrator',
      defaultRoute: '/dashboard',
      description: 'Full system access and management'
    }],
    [ROLES.RECEPTION, {
      id: ROLES.RECEPTION,
      name: 'Reception',
      displayName: 'Reception Staff',
      defaultRoute: '/rooms',
      description: 'Booking management, check-in/out, guest services'
    }],
    [ROLES.HOUSEKEEPING, {
      id: ROLES.HOUSEKEEPING,
      name: 'Housekeeping',
      displayName: 'Housekeeping Staff',
      defaultRoute: '/rooms',
      description: 'Room status and maintenance'
    }],
    [ROLES.GUEST, {
      id: ROLES.GUEST,
      name: 'Guest',
      displayName: 'Guest Account',
      defaultRoute: '/bookings',
      description: 'View bookings and invoices'
    }],
    [ROLES.ACCOUNTANT, {
      id: ROLES.ACCOUNTANT,
      name: 'Accountant',
      displayName: 'Accountant',
      defaultRoute: '/invoices',
      description: 'Financial management and reporting'
    }]
  ]);

  getRole(): string | null {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.roleId || payload.role;
    } catch {
      return null;
    }
  }

  getRoleConfig(roleId: string): RoleConfig | undefined {
    return this.roleConfigs.get(roleId);
  }

  getDefaultRoute(roleId?: string): string {
    const role = roleId || this.getRole();
    if (!role) return '/login';
    const config = this.getRoleConfig(role);
    return config?.defaultRoute || '/dashboard';
  }

  getRoleName(roleId?: string): string {
    const role = roleId || this.getRole();
    if (!role) return 'Unknown';
    const config = this.getRoleConfig(role);
    return config?.displayName || 'Unknown Role';
  }

  getRoleDescription(roleId?: string): string {
    const role = roleId || this.getRole();
    if (!role) return '';
    const config = this.getRoleConfig(role);
    return config?.description || '';
  }

  isAdmin() {
    return this.getRole() === ROLES.ADMIN;
  }

  isReception() {
    return this.getRole() === ROLES.RECEPTION;
  }

  isHousekeeping() {
    return this.getRole() === ROLES.HOUSEKEEPING;
  }

  isGuest() {
    return this.getRole() === ROLES.GUEST;
  }

  isAccountant() {
    return this.getRole() === ROLES.ACCOUNTANT;
  }

  isStaff() {
    const role = this.getRole();
    return role === ROLES.ADMIN || role === ROLES.RECEPTION || role === ROLES.HOUSEKEEPING || role === ROLES.ACCOUNTANT;
  }

  getAllRoles(): RoleConfig[] {
    return Array.from(this.roleConfigs.values());
  }
}