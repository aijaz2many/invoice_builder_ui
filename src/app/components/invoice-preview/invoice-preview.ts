import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ApiService } from '../../services/api.service';
import { InvoicePDFData } from '../../models/invoice.model';

@Component({
  selector: 'app-invoice-preview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './invoice-preview.html',
  styleUrl: './invoice-preview.scss'
})
export class InvoicePreviewComponent implements OnInit, OnDestroy {
  previewUrl: SafeResourceUrl | null = null;
  rawPreviewUrl: string | null = null;
  formData: InvoicePDFData | null = null;

  // View-only mode (from invoice list)
  viewOnly = false;
  viewInvoiceNumber = '';

  isGenerating = false;
  isSaving = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  constructor(
    private router: Router,
    private sanitizer: DomSanitizer,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    const historyState = window.history.state as {
      formData?: InvoicePDFData;
      pdfUrl?: string;
      invoiceNumber?: string;
    };

    // ── View-only mode: came from invoice list ──
    if (historyState?.pdfUrl) {
      this.viewOnly = true;
      this.viewInvoiceNumber = historyState.invoiceNumber || 'Invoice';
      this.previewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(historyState.pdfUrl);
      return;
    }

    // ── Edit mode: came from invoice builder ──
    this.formData = historyState?.formData ?? null;
    if (!this.formData) {
      this.router.navigate(['/builder']);
      return;
    }
    this.generatePreview();
  }

  ngOnDestroy(): void {
    if (this.rawPreviewUrl) {
      window.URL.revokeObjectURL(this.rawPreviewUrl);
    }
  }

  generatePreview(): void {
    if (!this.formData) return;
    this.isGenerating = true;
    this.errorMessage = null;

    this.apiService.previewInvoice(this.formData).subscribe({
      next: (blob: Blob) => {
        this.isGenerating = false;
        if (this.rawPreviewUrl) window.URL.revokeObjectURL(this.rawPreviewUrl);
        
        // Ensure the Blob has the correct PDF MIME type for proper browser display
        const pdfBlob = new Blob([blob], { type: 'application/pdf' });
        this.rawPreviewUrl = window.URL.createObjectURL(pdfBlob);
        this.previewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.rawPreviewUrl);
      },
      error: (err: any) => {
        this.isGenerating = false;
        this.errorMessage = 'Failed to generate invoice preview. Please go back and try again.';
        console.error('Preview error:', err);
      }
    });
  }

  saveInvoice(): void {
    if (!this.formData || this.isSaving) return;
    this.isSaving = true;
    this.errorMessage = null;

    this.apiService.saveInvoice(this.formData).subscribe({
      next: () => {
        this.isSaving = false;
        this.successMessage = 'Invoice saved successfully!';
        setTimeout(() => this.router.navigate(['/invoices']), 1500);
      },
      error: (err: any) => {
        if (err.status === 200 || err.status === 201) {
          this.isSaving = false;
          this.successMessage = 'Invoice saved successfully!';
          setTimeout(() => this.router.navigate(['/invoices']), 1500);
          return;
        }
        this.isSaving = false;
        this.errorMessage = err.error?.detail || 'Failed to save invoice. Please try again.';
        console.error('Save error:', err);
      }
    });
  }

  goBack(): void {
    if (this.viewOnly) {
      this.router.navigate(['/invoices']);
    } else {
      this.router.navigate(['/builder'], {
        state: { formData: this.formData }
      });
    }
  }
}
