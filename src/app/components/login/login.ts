import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class LoginComponent {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      emailId: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    this.apiService.login(this.loginForm.value).subscribe({
      next: (response) => {
        this.apiService.saveToken(response.access_token);

        // Refresh the global user state so the header updates immediately
        this.apiService.refreshCurrentUser().subscribe({
          next: (user) => {
            if (!user) {
              this.router.navigate(['/builder']);
              return;
            }
            const isAdmin = user.roles && user.roles.some((r: any) =>
              r.roleName && r.roleName.toLowerCase() === 'admin'
            );

            if (isAdmin) {
              this.router.navigate(['/admin/dashboard']);
              return;
            }

            // Check if standard user has businesses
            this.apiService.getUserBusinesses(user.userId).subscribe({
              next: (businesses) => {
                if (businesses.length === 0) {
                  this.router.navigate(['/create-business']);
                } else {
                  // Check if the first business has a template
                  this.apiService.checkTemplateExists(businesses[0].businessId).subscribe({
                    next: () => this.router.navigate(['/builder']),
                    error: (err) => {
                      if (err.status === 404) {
                        this.router.navigate(['/upload-template', businesses[0].businessId]);
                      } else {
                        this.router.navigate(['/builder']);
                      }
                    }
                  });
                }
              },
              error: () => this.router.navigate(['/builder']) // Fallback
            });
          },
          error: () => this.router.navigate(['/builder'])
        });
      },
      error: (err) => {
        this.isLoading = false;
        const details = err.error?.detail;
        if (err.status === 403 && details && details.includes('Default password detected')) {
          // Redirect to reset password with email
          this.router.navigate(['/reset-password'], {
            queryParams: { emailId: this.loginForm.value.emailId }
          });
          return;
        }
        this.errorMessage = details || 'Invalid email or password. Please try again.';
        console.error('Login error:', err);
      }
    });
  }
}
