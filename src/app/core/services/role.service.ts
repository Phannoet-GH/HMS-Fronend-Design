import { Injectable } from '@angular/core';

export const ROLES = {
  SUPER_ADMIN: 'r1',
  MANAGER: 'r2',
  HOUSEKEEPING: 'r3',
  FRONT_DESK: 'r4',
  ACCOUNT: 'r5'
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
    [ROLES.SUPER_ADMIN, {
      id: ROLES.SUPER_ADMIN,
      name: 'Super admin',
      displayName: 'Super Admin',
      defaultRoute: '/dashboard',
      description: 'Full system access and management'
    }],
    [ROLES.MANAGER, {
      id: ROLES.MANAGER,
      name: 'Manager',
      displayName: 'Manager',
      defaultRoute: '/rooms',
      description: 'Booking management, check-in/out, guest services'
    }],
    [ROLES.HOUSEKEEPING, {
      id: ROLES.HOUSEKEEPING,
      name: 'Housekeeping',
      displayName: 'Housekeeping',
      defaultRoute: '/rooms',
      description: 'Room status and maintenance'
    }],
    [ROLES.FRONT_DESK, {
      id: ROLES.FRONT_DESK,
      name: 'Front desk',
      displayName: 'Front Desk',
      defaultRoute: '/bookings',
      description: 'Front desk operations and booking support'
    }],
    [ROLES.ACCOUNT, {
      id: ROLES.ACCOUNT,
      name: 'Account',
      displayName: 'Account',
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

  isSuperAdmin() {
    return this.getRole() === ROLES.SUPER_ADMIN;
  }

  isManager() {
    return this.getRole() === ROLES.MANAGER;
  }

  isHousekeeping() {
    return this.getRole() === ROLES.HOUSEKEEPING;
  }

  isFrontDesk() {
    return this.getRole() === ROLES.FRONT_DESK;
  }

  isAccount() {
    return this.getRole() === ROLES.ACCOUNT;
  }

  isStaff() {
    const role = this.getRole();
    return role === ROLES.SUPER_ADMIN || role === ROLES.MANAGER || role === ROLES.HOUSEKEEPING || role === ROLES.ACCOUNT;
  }

  getAllRoles(): RoleConfig[] {
    return Array.from(this.roleConfigs.values());
  }
}