import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { RoleService } from '../services/role.service';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {

  constructor(
    private router: Router,
    private roleService: RoleService,
    private authService: AuthService
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const token = this.authService.getToken();

    if (!token) {
      this.router.navigate(['/login']);
      return false;
    }

    const userRole = this.authService.getUserRole();
    const requiredRoles = route.data['roles'] as string[] | undefined;

    if (!requiredRoles || requiredRoles.length === 0) {
      // No specific role requirement
      return true;
    }

    if (!userRole) {
      this.router.navigate(['/login']);
      return false;
    }

    if (requiredRoles.includes(userRole)) {
      return true;
    }

    // User doesn't have required role - redirect to role-specific dashboard
    const defaultRoute = this.roleService.getDefaultRoute(userRole);
    console.warn(`Access denied. User role '${this.roleService.getRoleName(userRole)}' is not allowed on this route.`);
    this.router.navigate([defaultRoute]);
    return false;
  }
}
