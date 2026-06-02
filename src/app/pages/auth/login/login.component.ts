import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { RoleService } from '../../../core/services/role.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {

  form = {
    email: '',
    password: ''
  };
  errorMessage = '';
  isSubmitting = false;

  constructor(
    private authService: AuthService,
    private roleService: RoleService,
    private router: Router
  ) {}

  login() {
    this.errorMessage = '';
    this.isSubmitting = true;

    this.authService.login(this.form).subscribe({
      next: (res) => {
        this.authService.saveToken(res.token);
        
        // Get the user's role and redirect accordingly
        const userRole = res.user.roleId;
        const defaultRoute = this.roleService.getDefaultRoute(userRole);
        const roleName = this.roleService.getRoleName(userRole);
        
        console.log(`✓ Login successful as ${roleName}. Redirecting to ${defaultRoute}...`);
        
        this.router.navigate([defaultRoute]).then(() => {
          this.isSubmitting = false;
        });
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Login failed. Please check your credentials.';
        console.error('Login error:', err);
        this.isSubmitting = false;
      }
    });
  }

  getRoleService() {
    return this.roleService;
  }
}
