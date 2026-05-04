import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NAV_GROUPS } from './sidebar.config';

type NavItem = {
  id: string;
  icon: string;
  label: string;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

type CurrentUser = {
  username?: string;
  roleId?: string;
};

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  @Input() currentUser: CurrentUser | null = null;

  navItems: NavGroup[] = [];

  ngOnInit() {
    this.setRoleMenu();
  }

  setRoleMenu() {
    const roleId = this.currentUser?.roleId;

    if (roleId === 'r3') {
      this.navItems = [
        {
          label: 'Operations',
          items: [
            { id: 'dashboard', icon: 'DB', label: 'Dashboard' },
            { id: 'rooms', icon: 'RM', label: 'Rooms' }
          ]
        }
      ];
    }
    else if (roleId === 'r2') {
      this.navItems = [
        {
          label: 'Operations',
          items: [
            { id: 'dashboard', icon: 'DB', label: 'Dashboard' },
            { id: 'bookings', icon: 'BK', label: 'Bookings' },
            { id: 'rooms', icon: 'RM', label: 'Rooms' },
            { id: 'guests', icon: 'GS', label: 'Guests' }
          ]
        }
      ];
    }
    else {
      this.navItems = NAV_GROUPS;
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  get roleName() {
    const roleMap: Record<string, string> = {
      r1: 'Admin',
      r2: 'Reception',
      r3: 'Housekeeping',
      r5: 'Accountant'
    };

    return roleMap[this.currentUser?.roleId || ''] || 'User';
  }
}
