import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  form = {
    username: '',
    email: '',
    password: ''
  };
  errorMessage = '';
  isSubmitting = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  register(form: NgForm) {
    if (form.invalid || this.isSubmitting) {
      form.control.markAllAsTouched();
      return;
    }

    this.errorMessage = '';
    this.isSubmitting = true;

    this.authService.register({
      username: this.form.username.trim(),
      email: this.form.email.trim().toLowerCase(),
      password: this.form.password,
      roleId: 'r4'    // always default — admin assigns roles separately
    }).pipe(
      finalize(() => { this.isSubmitting = false; })
    ).subscribe({
      next: () => this.router.navigate(['/login']),
      error: (err) => {
        this.errorMessage = err.error?.message || 'Registration failed';
      }
    });
  }
}