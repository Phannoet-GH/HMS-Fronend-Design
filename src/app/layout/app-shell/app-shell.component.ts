import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { AuthService, AuthUser } from '../../core/services/auth.service';
import { RoleService } from '../../core/services/role.service';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, SidebarComponent],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.css'
})
export class AppShellComponent implements OnInit {
  currentUser: AuthUser | null = null;
  roleName: string = '';

  constructor(
    private authService: AuthService,
    private roleService: RoleService
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    if (this.currentUser) {
      this.roleName = this.roleService.getRoleName(this.currentUser.roleId);
    }
  }
}
