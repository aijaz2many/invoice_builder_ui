import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-create-business',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './create-business.html',
  styleUrl: './create-business.scss'
})
export class CreateBusinessComponent implements OnInit {
  businessForm: FormGroup;
  businessTypes: any[] = [];
  isLoading = false;
  errorMessage: string | null = null;
  currentUserId: number | null = null;
  showOtherType = false;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private router: Router
  ) {
    this.businessForm = this.fb.group({
      businessName: ['', Validators.required],
      businessTypeId: ['', Validators.required],
      newBusinessTypeName: [''],
      businessAddress: ['', Validators.required],
      businessCity: ['', Validators.required],
      businessState: ['', Validators.required],
      businessCountry: [''],
      businessZip: ['', Validators.required],
      businessPhone: ['', Validators.required],
      businessEmail: ['', [Validators.required, Validators.email]],
      businessWebsite: [''],
      userId: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadBusinessTypes();
    this.loadCurrentUser();
  }

  loadBusinessTypes(): void {
    this.apiService.getBusinessTypes().subscribe({
      next: (types) => this.businessTypes = types,
      error: (err) => console.error('Error loading business types:', err)
    });
  }

  loadCurrentUser(): void {
    this.apiService.getCurrentUser().subscribe({
      next: (user) => {
        this.currentUserId = user.userId;
        this.businessForm.patchValue({ userId: user.userId });
      },
      error: (err) => console.error('Error loading current user:', err)
    });
  }

  onTypeChange(): void {
    const selectedValue = this.businessForm.get('businessTypeId')?.value;
    this.showOtherType = selectedValue === 'other';

    const newTypeControl = this.businessForm.get('newBusinessTypeName');
    if (this.showOtherType) {
      newTypeControl?.setValidators([Validators.required]);
    } else {
      newTypeControl?.clearValidators();
    }
    newTypeControl?.updateValueAndValidity();
  }

  onSubmit(): void {
    if (this.businessForm.invalid) {
      this.businessForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    if (this.showOtherType) {
      const newTypeName = this.businessForm.get('newBusinessTypeName')?.value;
      this.apiService.createBusinessType({ businessTypeName: newTypeName }).subscribe({
        next: (newType) => {
          const businessData = { ...this.businessForm.value, businessTypeId: newType.businessTypeId };
          delete businessData.newBusinessTypeName;
          this.submitBusinessData(businessData);
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err.error?.detail || 'Failed to create new business category.';
        }
      });
    } else {
      const businessData = { ...this.businessForm.value };
      delete businessData.newBusinessTypeName;
      this.submitBusinessData(businessData);
    }
  }

  private submitBusinessData(data: any): void {
    this.apiService.createBusiness(data).subscribe({
      next: (result) => {
        this.apiService.getCurrentUser().subscribe({
          next: (user: any) => {
            const isAdmin = user.roles && user.roles.some((r: any) =>
              r.roleName && r.roleName.toLowerCase() === 'admin'
            );
            this.isLoading = false;
            if (isAdmin) {
              this.router.navigate(['/admin/templates']);
            } else {
              this.router.navigate(['/upload-template', result.businessId]);
            }
          },
          error: () => {
            this.isLoading = false;
            this.router.navigate(['/upload-template', result.businessId]);
          }
        });
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.detail || 'Failed to create business. Please try again.';
        console.error('Create business error:', err);
      }
    });
  }
}
