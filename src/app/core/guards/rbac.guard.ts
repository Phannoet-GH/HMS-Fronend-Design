import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class RbacGuard implements CanActivate {

  constructor(private router: Router) {}

  canActivate(route: any): boolean {

    const token = localStorage.getItem('token');

    if (!token) {
      this.router.navigate(['/login']);
      return false;
    }

    const payload = JSON.parse(atob(token.split('.')[1]));

    const allowedRoles = route.data?.roles || [];

    if (!allowedRoles.includes(payload.roleId)) {
      this.router.navigate(['/rooms']);
      return false;
    }

    return true;
  }
}
