import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
    selector: 'app-template-upload',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './template-upload.html',
    styleUrl: './template-upload.scss'
})
export class TemplateUploadComponent implements OnInit {
    businessId: number | null = null;
    businessName: string = '';
    selectedFile: File | null = null;
    isUploading = false;
    errorMessage: string | null = null;
    successMessage: string | null = null;

    constructor(
        private route: ActivatedRoute,
        private apiService: ApiService,
        private router: Router
    ) { }

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.businessId = Number(id);
            this.loadBusinessDetails(this.businessId);
        } else {
            this.router.navigate(['/builder']);
        }
    }

    loadBusinessDetails(id: number): void {
        this.apiService.getBusiness(id).subscribe({
            next: (business) => {
                this.businessName = business.businessName;
            },
            error: (err) => console.error('Error loading business:', err)
        });
    }

    onFileSelected(event: any): void {
        const file = event.target.files[0];
        if (file) {
            const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
            if (!allowedTypes.includes(file.type)) {
                this.errorMessage = 'Please select a valid PDF or Image (JPG, PNG) file.';
                this.selectedFile = null;
                return;
            }
            this.selectedFile = file;
            this.errorMessage = null;
        }
    }

    onUpload(): void {
        if (!this.selectedFile || !this.businessId) return;

        this.isUploading = true;
        this.errorMessage = null;

        this.apiService.uploadTemplate(this.businessId, this.selectedFile).subscribe({
            next: (response) => {
                this.isUploading = false;
                const status = response.templateStatus;
                if (status === 'PENDING') {
                    this.successMessage = 'Image uploaded! Our admin will convert it to a PDF template soon. Redirecting...';
                } else {
                    this.successMessage = 'Template uploaded successfully! Redirecting...';
                }

                setTimeout(() => {
                    this.router.navigate(['/builder']);
                }, 3000);
            },
            error: (err) => {
                this.isUploading = false;
                this.errorMessage = err.error?.detail || 'Failed to upload template. Please try again.';
            }
        });
    }
}
