import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Business, InvoiceResponse } from '../../models/invoice.model';

@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './invoice-list.html',
  styleUrl: './invoice-list.scss'
})
export class InvoiceListComponent implements OnInit {
  invoices: InvoiceResponse[] = [];
  businesses: Business[] = [];
  selectedBusinessId: string = 'all';
  isAdmin = false;
  isLoading = true;
  currentUserId: number | null = null;
  showDeleteModal = false;
  invoiceToDelete: InvoiceResponse | null = null;

  constructor(private apiService: ApiService) { }

  ngOnInit(): void {
    this.apiService.getCurrentUser().subscribe({
      next: (user) => {
        this.currentUserId = user.userId;
        this.isAdmin = user.roles && user.roles.some((r: any) =>
          r.roleName && r.roleName.toLowerCase() === 'admin'
        );

        if (this.isAdmin) {
          this.loadAllBusinesses();
        }

        this.loadInvoices();
      },
      error: (err) => {
        console.error('Error loading current user:', err);
        this.isLoading = false;
      }
    });
  }

  loadAllBusinesses(): void {
    this.apiService.getBusinesses().subscribe({
      next: (data) => this.businesses = data,
      error: (err) => console.error('Error loading businesses:', err)
    });
  }

  loadInvoices(): void {
    this.isLoading = true;
    let invoicesObservable;

    if (this.isAdmin) {
      if (this.selectedBusinessId === 'all') {
        invoicesObservable = this.apiService.getInvoices();
      } else {
        invoicesObservable = this.apiService.getBusinessInvoices(Number(this.selectedBusinessId));
      }
    } else if (this.currentUserId) {
      invoicesObservable = this.apiService.getUserInvoices(this.currentUserId);
    } else {
      this.isLoading = false;
      return;
    }

    invoicesObservable.subscribe({
      next: (data) => {
        this.invoices = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading invoices:', err);
        this.isLoading = false;
      }
    });
  }

  onBusinessChange(): void {
    this.loadInvoices();
  }

  downloadInvoice(invoice: InvoiceResponse): void {
    if (invoice.pdfURL) {
      window.open(invoice.pdfURL, '_blank');
    } else {
      alert('PDF URL not available for this invoice.');
    }
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString();
  }

  deleteInvoice(invoice: InvoiceResponse): void {
    this.invoiceToDelete = invoice;
    this.showDeleteModal = true;
  }

  confirmDelete(): void {
    if (this.invoiceToDelete) {
      this.apiService.deleteInvoice(this.invoiceToDelete.invoiceId).subscribe({
        next: () => {
          this.invoices = this.invoices.filter(i => i.invoiceId !== this.invoiceToDelete?.invoiceId);
          this.closeDeleteModal();
        },
        error: (err) => {
          console.error('Error deleting invoice:', err);
          alert('Failed to delete invoice. Please try again.');
          this.closeDeleteModal();
        }
      });
    }
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.invoiceToDelete = null;
  }
}
