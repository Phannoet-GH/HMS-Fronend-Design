import { Routes } from '@angular/router';
import { LoginComponent } from './pages/auth/login/login.component';
import { RegisterComponent } from './pages/auth/register/register.component';
import { RoomsComponent } from './pages/rooms/rooms.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { BookingsComponent } from './pages/bookings/bookings.component';
import { GuestsComponent } from './pages/guests/guests.component';
import { InvoicesComponent } from './pages/invoices/invoices.component';
import { ReportsComponent } from './pages/reports/reports.component';
import { AppShellComponent } from './layout/app-shell/app-shell.component';
import { AuthGuard } from './core/guards/auth.guard';

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
        component: DashboardComponent
      },

      {
        path: 'checkout',
        component: DashboardComponent
      },

      {
        path: 'bookings',
        component: BookingsComponent
      },

      {
        path: 'room-services',
        component: DashboardComponent
      },

      {
        path: 'service-requests',
        component: DashboardComponent
      },

      /* FINANCE */

      {
        path: 'invoices',
        component: InvoicesComponent
      },

      {
        path: 'payments',
        component: DashboardComponent
      },

      /* GUESTS & STAFF */

      {
        path: 'guests',
        component: GuestsComponent
      },

      {
        path: 'employees',
        component: DashboardComponent
      },

      {
        path: 'departments',
        component: DashboardComponent
      },

      /* SUPPLY CHAIN */

      {
        path: 'inventory',
        component: DashboardComponent
      },

      {
        path: 'suppliers',
        component: DashboardComponent
      },

      {
        path: 'purchase-orders',
        component: DashboardComponent
      },

      /* ADMIN */

      {
        path: 'users',
        component: DashboardComponent
      },

      {
        path: 'roles',
        component: DashboardComponent
      },

      {
        path: 'reports',
        component: ReportsComponent
      },

      {
        path: 'activity-logs',
        component: DashboardComponent
      }

    ]
  },

  /* NOT FOUND */

  {
    path: '**',
    redirectTo: 'login'
  }

];
