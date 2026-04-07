import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
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
  protected readonly Math = Math;

  // Search & Sort State
  allInvoices: InvoiceResponse[] = [];
  searchTerm: string = '';
  sortColumn: string = 'invoiceId';
  sortDirection: 'asc' | 'desc' = 'desc';

  // Pagination
  currentPage: number = 1;
  pageSize: number = 10;
  pageSizeOptions: number[] = [10, 20, 50, 100];
  totalPages: number = 0;
  pagesArray: number[] = [];

  constructor(private apiService: ApiService, private router: Router) { }

  ngOnInit(): void {
    this.apiService.currentUser$.subscribe({
      next: (user) => {
        if (!user) {
          // If no user in subject, try refreshing it once
          if (this.apiService.getToken()) {
            this.apiService.refreshCurrentUser().subscribe();
          } else {
            this.isLoading = false;
          }
          return;
        }

        // Robust ID extraction
        this.currentUserId = user.userId || user.user_id || user.id;
        this.isAdmin = this.apiService.checkIsAdmin(user);

        if (this.isAdmin) {
          this.loadAllBusinesses();
        }

        this.loadInvoices();
      },
      error: (err) => {
        console.error('Error in user subscription:', err);
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
        this.allInvoices = Array.isArray(data) ? data : [];
        this.processInvoices();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading invoices:', err);
        this.isLoading = false;
      }
    });
  }

  onBusinessChange(): void {
    this.currentPage = 1; // Reset to first page
    this.loadInvoices();
  }

  processInvoices(): void {
    let result = [...this.allInvoices];

    // Search
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(inv => {
        return (
          inv.invoiceNumber?.toLowerCase().includes(term) ||
          inv.paymentMode?.toLowerCase().includes(term) ||
          inv.paymentType?.toLowerCase().includes(term) ||
          inv.invoiceAmount?.toString().includes(term) ||
          this.formatDate(inv.invoiceDate).toLowerCase().includes(term) ||
          inv.customerName?.toLowerCase().includes(term) ||
          inv.customerPhone?.toLowerCase().includes(term)
        );
      });
    }

    // Sort
    result.sort((a: any, b: any) => {
      let valA = a[this.sortColumn];
      let valB = b[this.sortColumn];

      // Handle nested properties manually if needed
      if (this.sortColumn === 'customerName') {
        valA = a.customerName || '';
        valB = b.customerName || '';
      } else if (this.sortColumn === 'customerPhone') {
        valA = a.customerPhone || '';
        valB = b.customerPhone || '';
      }

      if (this.sortColumn === 'invoiceDate') {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      } else if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      if (valA < valB) return this.sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    this.invoices = result;
    this.currentPage = 1;
    this.updatePagination();
  }

  onSearch(): void {
    this.processInvoices();
  }

  sortBy(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.processInvoices();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.invoices.length / this.pageSize);
    this.pagesArray = Array.from({ length: this.totalPages }, (_, i) => i + 1);

    // Safety check: if current page is now beyond total pages
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    }
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
    this.updatePagination();
  }

  get pagedInvoices(): InvoiceResponse[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.invoices.slice(startIndex, startIndex + this.pageSize);
  }

  downloadInvoice(invoice: InvoiceResponse): void {
    if (invoice.pdfURL) {
      window.open(invoice.pdfURL, '_blank');
    } else {
      alert('PDF URL not available for this invoice.');
    }
  }

  viewInvoice(invoice: InvoiceResponse): void {
    if (invoice.pdfURL) {
      this.router.navigate(['/invoice-preview'], {
        state: {
          pdfUrl: invoice.pdfURL,
          invoiceNumber: invoice.invoiceNumber
        }
      });
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
          this.updatePagination();
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
