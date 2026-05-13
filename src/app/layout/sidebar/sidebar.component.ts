import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
  imports: [CommonModule, RouterLink]
})
export class SidebarComponent {

  roleName = 'Super Admin';

  currentUser = {
    username: 'Priya Nair'
  };

  navItems = [
    {
      label: 'Operations',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: '◈'
        },
        {
          id: 'rooms',
          label: 'Rooms',
          icon: '▣'
        },
        {
          id: 'checkin',
          label: 'Check In',
          icon: '↓'
        },
        {
          id: 'checkout',
          label: 'Check Out',
          icon: '↑'
        },
        {
          id: 'bookings',
          label: 'Bookings',
          icon: '◎'
        },
        {
          id: 'room-services',
          label: 'Room Services',
          icon: '◆'
        },
        {
          id: 'service-requests',
          label: 'Service Requests',
          icon: '◇'
        }
      ]
    },

    {
      label: 'Finance',
      items: [
        {
          id: 'invoices',
          label: 'Invoices',
          icon: '◈'
        },
        {
          id: 'payments',
          label: 'Payments',
          icon: '○'
        }
      ]
    },

    {
      label: 'Guests & Staff',
      items: [
        {
          id: 'guests',
          label: 'Guests',
          icon: '◉'
        },
        {
          id: 'employees',
          label: 'Employees',
          icon: '▤'
        },
        {
          id: 'departments',
          label: 'Departments',
          icon: '◌'
        }
      ]
    },

    {
      label: 'Supply Chain',
      items: [
        {
          id: 'inventory',
          label: 'Inventory',
          icon: '▦'
        },
        {
          id: 'suppliers',
          label: 'Suppliers',
          icon: '△'
        },
        {
          id: 'purchase-orders',
          label: 'Purchase Orders',
          icon: '◩'
        }
      ]
    },

    {
      label: 'Admin',
      items: [
        {
          id: 'users',
          label: 'Users',
          icon: '○'
        },
        {
          id: 'roles',
          label: 'Roles & Permissions',
          icon: '◈'
        },
        {
          id: 'reports',
          label: 'Reports',
          icon: '▥'
        },
        {
          id: 'activity-logs',
          label: 'Activity Logs',
          icon: '◫'
        }
      ]
    }
  ];

  logout() {
    console.log('Logout');
  }
}
