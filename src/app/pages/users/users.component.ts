import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { finalize, timeout } from 'rxjs';
import { RoleService } from '../../core/services/role.service';
import { User, UserPayload, UserService } from '../../core/services/user.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css'
})
export class UsersComponent implements OnInit, OnDestroy {
  users: User[] = [];
  form: UserPayload = { username: '', email: '', password: '', roleId: 'r3' };
  selectedId: string | null = null;
  showForm = false;
  isLoading = false;
  isSaving = false;
  isDeleting = false;
  userPendingDelete: User | null = null;
  errorMessage = '';
  private refreshTimer?: ReturnType<typeof setInterval>;

  constructor(private userService: UserService, private roleService: RoleService) { }

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

    this.userService.getUsers().pipe(
      timeout(10000),
      finalize(() => {
        this.isLoading = false;
      })
    ).subscribe({
      next: (res) => {
        this.users = Array.isArray(res.data?.users) ? res.data.users : [];
        this.errorMessage = '';
      },
      error: (err) => {
        if (!silent) {
          this.errorMessage = err.name === 'TimeoutError'
            ? 'User data timed out. Check that the backend and MongoDB are running, then refresh.'
            : err.error?.message || 'Unable to load users';
        }
      }
    });
  }

  private autoRefresh() {
    if (this.showForm || this.isSaving || this.isLoading) return;
    this.loadUsers(true);
  }

  saveUser(form: NgForm) {
    if (form.invalid || this.isSaving) {
      form.control.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';

    const username = this.form.username.trim();
    const email = this.form.email.trim().toLowerCase();
    const password = this.form.password?.trim() || '';

    const request = this.selectedId
      ? this.userService.updateUser(this.selectedId, {
        username,
        email,
        roleId: this.form.roleId
      })
      : this.userService.createUser({
        username,
        email,
        password,
        roleId: this.form.roleId
      });

    request.pipe(
      timeout(15000),
      finalize(() => {
        this.isSaving = false;
      })
    ).subscribe({
      next: () => {
        this.showForm = false;
        this.resetForm();
        this.loadUsers();
      },
      error: (err) => {
        this.errorMessage = err.name === 'TimeoutError'
          ? 'User save timed out. Check that the backend and MongoDB are running, then try again.'
          : err.error?.message || 'Unable to save user';
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
    this.userPendingDelete = user;
  }

  cancelDeleteUser() {
    if (this.isDeleting) return;
    this.userPendingDelete = null;
  }

  confirmDeleteUser() {
    if (!this.userPendingDelete || this.isDeleting) return;

    this.isDeleting = true;
    this.errorMessage = '';

    this.userService.deleteUser(this.userPendingDelete._id).pipe(
      timeout(15000),
      finalize(() => {
        this.isDeleting = false;
      })
    ).subscribe({
      next: () => {
        this.userPendingDelete = null;
        this.loadUsers();
      },
      error: (err) => {
        this.errorMessage = err.name === 'TimeoutError'
          ? 'User delete timed out. Check that the backend and MongoDB are running, then try again.'
          : err.error?.message || 'Unable to delete user';
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
