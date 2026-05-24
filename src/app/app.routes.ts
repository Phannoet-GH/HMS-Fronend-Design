import { Routes } from '@angular/router';
import { LoginComponent } from './pages/auth/login/login.component';
import { RegisterComponent } from './pages/auth/register/register.component';
import { RoomsComponent } from './pages/rooms/rooms.component';
import { CheckInComponent } from './pages/check-in/check-in.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { BookingsComponent } from './pages/bookings/bookings.component';
import { GuestsComponent } from './pages/guests/guests.component';
import { InvoicesComponent } from './pages/invoices/invoices.component';
import { ReportsComponent } from './pages/reports/reports.component';
import { AppShellComponent } from './layout/app-shell/app-shell.component';
import { AuthGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/role.guard';
import { ROLES } from './core/services/role.service';
import { CheckoutComponent } from './pages/checkout/checkout.component';
import { RoomServicesComponent } from './pages/room-services/room-services.component';
import { ServiceRequestsComponent } from './pages/service-requests/service-requests.component';
import { PaymentsComponent } from './pages/payments/payments.component';
import { EmployeesComponent } from './pages/employees/employees.component';
import { DepartmentsComponent } from './pages/departments/departments.component';
import { InventoryComponent } from './pages/inventory/inventory.component';
import { SuppliersComponent } from './pages/suppliers/suppliers.component';
import { PurchaseOrdersComponent } from './pages/purchase-orders/purchase-orders.component';
import { UsersComponent } from './pages/users/users.component';
import { RolesComponent } from './pages/roles/roles.component';
import { ActivityLogsComponent } from './pages/activity-logs/activity-logs.component';

export const routes: Routes = [

  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },

  /* AUTH */

  {
    path: 'login',
    component: LoginComponent
  },

  {
    path: 'register',
    component: RegisterComponent
  },

  /* APP */

  {
    path: '',
    component: AppShellComponent,
    canActivate: [AuthGuard],

    children: [

      /* OPERATIONS */

      {
        path: 'dashboard',
        component: DashboardComponent,
        canActivate: [RoleGuard],
        data: { roles: [ROLES.SUPER_ADMIN] }
      },

      {
        path: 'rooms',
        component: RoomsComponent,
        canActivate: [RoleGuard],
        data: { roles: [ROLES.SUPER_ADMIN, ROLES.MANAGER, ROLES.HOUSEKEEPING, ROLES.FRONT_DESK] }
      },

      {
        path: 'checkin',
        component: CheckInComponent,
        canActivate: [RoleGuard],
        data: { roles: [ROLES.SUPER_ADMIN, ROLES.MANAGER, ROLES.FRONT_DESK] }
      },

      {
        path: 'check-in',
        component: CheckInComponent,
        canActivate: [RoleGuard],
        data: { roles: [ROLES.SUPER_ADMIN, ROLES.MANAGER, ROLES.FRONT_DESK] }
      },

      {
        path: 'checkout',
        component: CheckoutComponent,
        canActivate: [RoleGuard],
        data: { roles: [ROLES.SUPER_ADMIN, ROLES.MANAGER, ROLES.FRONT_DESK] }
      },

      {
        path: 'bookings',
        component: BookingsComponent,
        canActivate: [RoleGuard],
        data: { roles: [ROLES.SUPER_ADMIN, ROLES.MANAGER, ROLES.FRONT_DESK] }
      },

      {
        path: 'room-services',
        component: RoomServicesComponent,
        canActivate: [RoleGuard],
        data: { roles: [ROLES.SUPER_ADMIN, ROLES.MANAGER] }
      },

      {
        path: 'service-requests',
        component: ServiceRequestsComponent,
        canActivate: [RoleGuard],
        data: { roles: [ROLES.SUPER_ADMIN, ROLES.MANAGER, ROLES.FRONT_DESK] }
      },

      /* FINANCE */

      {
        path: 'invoices',
        component: InvoicesComponent,
        canActivate: [RoleGuard],
        data: { roles: [ROLES.SUPER_ADMIN, ROLES.FRONT_DESK, ROLES.ACCOUNT] }
      },

      {
        path: 'payments',
        component: PaymentsComponent,
        canActivate: [RoleGuard],
        data: { roles: [ROLES.SUPER_ADMIN, ROLES.ACCOUNT] }
      },

      /* GUESTS & STAFF */

      {
        path: 'guests',
        component: GuestsComponent,
        canActivate: [RoleGuard],
        data: { roles: [ROLES.SUPER_ADMIN, ROLES.MANAGER] }
      },

      {
        path: 'employees',
        component: EmployeesComponent,
        canActivate: [RoleGuard],
        data: { roles: [ROLES.SUPER_ADMIN] }
      },

      {
        path: 'departments',
        component: DepartmentsComponent,
        canActivate: [RoleGuard],
        data: { roles: [ROLES.SUPER_ADMIN] }
      },

      /* SUPPLY CHAIN */

      {
        path: 'inventory',
        component: InventoryComponent,
        canActivate: [RoleGuard],
        data: { roles: [ROLES.SUPER_ADMIN] }
      },

      {
        path: 'suppliers',
        component: SuppliersComponent,
        canActivate: [RoleGuard],
        data: { roles: [ROLES.SUPER_ADMIN] }
      },

      {
        path: 'purchase-orders',
        component: PurchaseOrdersComponent,
        canActivate: [RoleGuard],
        data: { roles: [ROLES.SUPER_ADMIN] }
      },

      /* ADMIN */

      {
        path: 'users',
        component: UsersComponent,
        canActivate: [RoleGuard],
        data: { roles: [ROLES.SUPER_ADMIN] }
      },

      {
        path: 'roles',
        component: RolesComponent,
        canActivate: [RoleGuard],
        data: { roles: [ROLES.SUPER_ADMIN] }
      },

      {
        path: 'reports',
        component: ReportsComponent,
        canActivate: [RoleGuard],
        data: { roles: [ROLES.SUPER_ADMIN, ROLES.ACCOUNT] }
      },

      {
        path: 'activity-logs',
        component: ActivityLogsComponent,
        canActivate: [RoleGuard],
        data: { roles: [ROLES.SUPER_ADMIN] }
      }

    ]
  },

  /* NOT FOUND */

  {
    path: '**',
    redirectTo: 'login'
  }

];
