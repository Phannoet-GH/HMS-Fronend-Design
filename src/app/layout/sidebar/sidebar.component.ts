import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ROLES, RoleService } from '../../core/services/role.service';

interface NavItem {
  id: string;
  label: string;
  icon: string;
  roles?: string[];
}

interface NavSection {
  label: string;
  items: NavItem[];
}

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
  imports: [CommonModule, RouterLink, RouterLinkActive]
})
export class SidebarComponent implements OnInit {
  currentUserRole: string | null = null;
  currentUsername = 'User';
  roleName = 'User';

  readonly navSections: NavSection[] = [
    {
      label: 'Operations',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: 'D', roles: [ROLES.SUPER_ADMIN] },
        { id: 'rooms', label: 'Rooms', icon: 'R', roles: [ROLES.SUPER_ADMIN, ROLES.MANAGER, ROLES.HOUSEKEEPING, ROLES.FRONT_DESK] },
        { id: 'checkin', label: 'Check In', icon: 'I', roles: [ROLES.SUPER_ADMIN, ROLES.MANAGER, ROLES.FRONT_DESK] },
        { id: 'checkout', label: 'Check Out', icon: 'O', roles: [ROLES.SUPER_ADMIN, ROLES.MANAGER, ROLES.FRONT_DESK] },
        { id: 'bookings', label: 'Bookings', icon: 'B', roles: [ROLES.SUPER_ADMIN, ROLES.MANAGER, ROLES.FRONT_DESK] },
        { id: 'room-services', label: 'Room Services', icon: 'S', roles: [ROLES.SUPER_ADMIN, ROLES.MANAGER] },
        { id: 'service-requests', label: 'Service Requests', icon: 'Q', roles: [ROLES.SUPER_ADMIN, ROLES.MANAGER, ROLES.FRONT_DESK] }
      ]
    },
    {
      label: 'Finance',
      items: [
        { id: 'invoices', label: 'Invoices', icon: 'N', roles: [ROLES.SUPER_ADMIN, ROLES.FRONT_DESK, ROLES.ACCOUNT] },
        { id: 'payments', label: 'Payments', icon: 'P', roles: [ROLES.SUPER_ADMIN, ROLES.ACCOUNT] }
      ]
    },
    {
      label: 'Guests & Staff',
      items: [
        { id: 'guests', label: 'Guests', icon: 'G', roles: [ROLES.SUPER_ADMIN, ROLES.MANAGER] },
        { id: 'employees', label: 'Employees', icon: 'E', roles: [ROLES.SUPER_ADMIN] },
        { id: 'departments', label: 'Departments', icon: 'T', roles: [ROLES.SUPER_ADMIN] }
      ]
    },
    {
      label: 'Supply Chain',
      items: [
        { id: 'inventory', label: 'Inventory', icon: 'V', roles: [ROLES.SUPER_ADMIN] },
        { id: 'suppliers', label: 'Suppliers', icon: 'L', roles: [ROLES.SUPER_ADMIN] },
        { id: 'purchase-orders', label: 'Purchase Orders', icon: 'U', roles: [ROLES.SUPER_ADMIN] }
      ]
    },
    {
      label: 'Admin',
      items: [
        { id: 'users', label: 'Users', icon: 'Y', roles: [ROLES.SUPER_ADMIN] },
        { id: 'roles', label: 'Roles', icon: 'A', roles: [ROLES.SUPER_ADMIN] },
        { id: 'reports', label: 'Reports', icon: 'M', roles: [ROLES.SUPER_ADMIN, ROLES.ACCOUNT] },
        { id: 'activity-logs', label: 'Activity Logs', icon: 'H', roles: [ROLES.SUPER_ADMIN] }
      ]
    }
  ];

  constructor(
    private authService: AuthService,
    private roleService: RoleService,
    private router: Router
  ) {}

  ngOnInit() {
    this.currentUserRole = this.authService.getUserRole();
    const currentUser = this.authService.getCurrentUser();
    this.currentUsername = currentUser?.username || 'User';
    this.roleName = this.roleService.getRoleName(this.currentUserRole || '');
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  canViewItem(item: NavItem): boolean {
    return !item.roles?.length || item.roles.includes(this.currentUserRole || '');
  }

  canViewSection(section: NavSection): boolean {
    return section.items.some((item) => this.canViewItem(item));
  }

  getVisibleItems(section: NavSection): NavItem[] {
    return section.items.filter((item) => this.canViewItem(item));
  }
}
