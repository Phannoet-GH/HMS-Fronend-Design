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
        component: DashboardComponent
      },

      {
        path: 'rooms',
        component: RoomsComponent
      },

      {
        path: 'checkin',
        component: CheckInComponent
      },

      {
        path: 'check-in',
        component: CheckInComponent
      },

      {
        path: 'checkout',
        component: CheckoutComponent
      },

      {
        path: 'bookings',
        component: BookingsComponent
      },

      {
        path: 'room-services',
        component: RoomServicesComponent
      },

      {
        path: 'service-requests',
        component: ServiceRequestsComponent
      },

      /* FINANCE */

      {
        path: 'invoices',
        component: InvoicesComponent
      },

      {
        path: 'payments',
        component: PaymentsComponent
      },

      /* GUESTS & STAFF */

      {
        path: 'guests',
        component: GuestsComponent
      },

      {
        path: 'employees',
        component: EmployeesComponent
      },

      {
        path: 'departments',
        component: DepartmentsComponent
      },

      /* SUPPLY CHAIN */

      {
        path: 'inventory',
        component: InventoryComponent
      },

      {
        path: 'suppliers',
        component: SuppliersComponent
      },

      {
        path: 'purchase-orders',
        component: PurchaseOrdersComponent
      },

      /* ADMIN */

      {
        path: 'users',
        component: UsersComponent
      },

      {
        path: 'roles',
        component: RolesComponent
      },

      {
        path: 'reports',
        component: ReportsComponent
      },

      {
        path: 'activity-logs',
        component: ActivityLogsComponent
      }

    ]
  },

  /* NOT FOUND */

  {
    path: '**',
    redirectTo: 'login'
  }

];
