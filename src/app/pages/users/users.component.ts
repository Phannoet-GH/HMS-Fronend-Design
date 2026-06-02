import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RoleService } from '../../core/services/role.service';
import { User, UserPayload, UserService } from '../../core/services/user.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css'
})
export class UsersComponent implements OnDestroy {
  users: User[] = [];
  form: UserPayload = { username: '', email: '', password: '', roleId: 'r3' };
  selectedId: string | null = null;
  showForm = false;
  isLoading = false;
  isSaving = false;
  errorMessage = '';
  private refreshTimer?: ReturnType<typeof setInterval>;

  constructor(private userService: UserService, private roleService: RoleService) {}

  ngOnInit() {
    this.loadUsers();
    this.refreshTimer = setInterval(() => this.autoRefresh(), 15000);
  }

  ngOnDestroy() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
  }

  loadUsers(silent = false) {
    if (!silent) {
      this.isLoading = true;
      this.errorMessage = '';
    }

    this.userService.getUsers().subscribe({
      next: (res) => {
        this.users = res.data.users;
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Unable to load users';
        this.isLoading = false;
      }
    });
  }

  private autoRefresh() {
    if (this.showForm || this.isSaving || this.isLoading) return;
    this.loadUsers(true);
  }

  saveUser() {
    this.isSaving = true;
    this.errorMessage = '';

    const request = this.selectedId
      ? this.userService.updateUser(this.selectedId, {
          username: this.form.username,
          email: this.form.email,
          roleId: this.form.roleId
        })
      : this.userService.createUser(this.form as UserPayload & { password: string });

    request.subscribe({
      next: () => {
        this.isSaving = false;
        this.showForm = false;
        this.resetForm();
        this.loadUsers();
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Unable to save user';
        this.isSaving = false;
      }
    });
  }

  editUser(user: User) {
    this.selectedId = user._id;
    this.form = {
      username: user.username,
      email: user.email,
      roleId: user.roleId,
      password: ''
    };
    this.showForm = true;
  }

  deleteUser(user: User) {
    if (!confirm(`Delete ${user.username}?`)) return;

    this.userService.deleteUser(user._id).subscribe({
      next: () => this.loadUsers(),
      error: (err) => {
        this.errorMessage = err.error?.message || 'Unable to delete user';
      }
    });
  }

  toggleForm() {
    this.showForm = !this.showForm;
    if (!this.showForm) this.resetForm();
  }

  resetForm() {
    this.selectedId = null;
    this.form = { username: '', email: '', password: '', roleId: 'r3' };
  }

  roleName(roleId: string) {
    return this.roleService.getRoleName(roleId);
  }

  get roles() {
    return this.roleService.getAllRoles();
  }

  get adminUsers() {
    return this.users.filter((user) => user.roleId === 'r1').length;
  }
}
