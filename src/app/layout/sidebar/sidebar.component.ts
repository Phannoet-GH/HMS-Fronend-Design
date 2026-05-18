import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { RoleService } from '../../core/services/role.service';

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
        { id: 'dashboard', label: 'Dashboard', icon: 'D', roles: ['r1'] },
        { id: 'rooms', label: 'Rooms', icon: 'R', roles: ['r1', 'r2', 'r3'] },
        { id: 'checkin', label: 'Check In', icon: 'I', roles: ['r1', 'r2'] },
        { id: 'checkout', label: 'Check Out', icon: 'O', roles: ['r1', 'r2'] },
        { id: 'bookings', label: 'Bookings', icon: 'B', roles: ['r1', 'r2', 'r4'] },
        { id: 'room-services', label: 'Room Services', icon: 'S', roles: ['r1', 'r2'] },
        { id: 'service-requests', label: 'Service Requests', icon: 'Q', roles: ['r1', 'r2', 'r4'] }
      ]
    },
    {
      label: 'Finance',
      items: [
        { id: 'invoices', label: 'Invoices', icon: 'N', roles: ['r1', 'r4', 'r5'] },
        { id: 'payments', label: 'Payments', icon: 'P', roles: ['r1', 'r5'] }
      ]
    },
    {
      label: 'Guests & Staff',
      items: [
        { id: 'guests', label: 'Guests', icon: 'G', roles: ['r1', 'r2'] },
        { id: 'employees', label: 'Employees', icon: 'E', roles: ['r1'] },
        { id: 'departments', label: 'Departments', icon: 'T', roles: ['r1'] }
      ]
    },
    {
      label: 'Supply Chain',
      items: [
        { id: 'inventory', label: 'Inventory', icon: 'V', roles: ['r1'] },
        { id: 'suppliers', label: 'Suppliers', icon: 'L', roles: ['r1'] },
        { id: 'purchase-orders', label: 'Purchase Orders', icon: 'U', roles: ['r1'] }
      ]
    },
    {
      label: 'Admin',
      items: [
        { id: 'users', label: 'Users', icon: 'Y', roles: ['r1'] },
        { id: 'roles', label: 'Roles', icon: 'A', roles: ['r1'] },
        { id: 'reports', label: 'Reports', icon: 'M', roles: ['r1', 'r5'] },
        { id: 'activity-logs', label: 'Activity Logs', icon: 'H', roles: ['r1'] }
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
