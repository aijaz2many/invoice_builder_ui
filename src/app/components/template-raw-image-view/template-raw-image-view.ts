import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ApiService } from '../../services/api.service';
import { Business } from '../../models/invoice.model';

@Component({
  selector: 'app-template-raw-image-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './template-raw-image-view.html',
  styleUrls: ['./template-raw-image-view.scss']
})
export class TemplateRawImageViewComponent implements OnInit, OnDestroy {
  businessId: number | null = null;
  business: Business | null = null;
  imageUrl: SafeUrl | null = null;
  rawImageUrl: string | null = null;
  isLoading = true;
  errorMessage: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.businessId = +params['id'];
      if (this.businessId) {
        this.loadBusinessDetails();
        this.loadRawImage();
      } else {
        this.errorMessage = 'Invalid Business ID';
        this.isLoading = false;
      }
    });
  }

  ngOnDestroy(): void {
    if (this.rawImageUrl) {
      window.URL.revokeObjectURL(this.rawImageUrl);
    }
  }

  loadBusinessDetails(): void {
    if (!this.businessId) return;
    this.apiService.getBusiness(this.businessId).subscribe({
      next: (data) => this.business = data,
      error: (err) => console.error('Error loading business details:', err)
    });
  }

  loadRawImage(): void {
    if (!this.businessId) return;
    this.isLoading = true;
    this.apiService.checkTemplateExists(this.businessId).subscribe({
      next: (blob: Blob) => {
        this.rawImageUrl = window.URL.createObjectURL(blob);
        this.imageUrl = this.sanitizer.bypassSecurityTrustUrl(this.rawImageUrl);
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = 'Failed to load raw image. It might not exist.';
        this.isLoading = false;
        console.error('Error loading raw image:', err);
      }
    });
  }

  downloadImage(): void {
    if (!this.rawImageUrl || !this.business) return;
    
    // Determine extension from blob type if possible, or default to .png
    // The backend usually serves the original file.
    const a = document.createElement('a');
    a.href = this.rawImageUrl;
    a.download = `raw-template-${this.business.businessName.replace(/\s+/g, '-')}-${this.businessId}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  goBack(): void {
    this.router.navigate(['/admin/templates']);
  }

  cancel(): void {
    this.goBack();
  }
}
