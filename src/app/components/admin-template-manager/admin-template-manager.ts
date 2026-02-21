import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { Business } from '../../models/invoice.model';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-admin-template-manager',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule],
    templateUrl: './admin-template-manager.html',
    styleUrls: ['./admin-template-manager.scss']
})
export class AdminTemplateManagerComponent implements OnInit {
    businesses: Business[] = [];
    isLoading = true;
    errorMessage: string | null = null;
    successMessage: string | null = null;
    selectedBusinessId: number | null = null;
    isUploading = false;

    pendingCount = 0;
    showAll = false;
    searchText = '';
    allBusinesses: Business[] = [];
    quickBusinessId: number | null = null;

    constructor(private apiService: ApiService) { }

    ngOnInit(): void {
        this.loadAllBusinesses();
    }

    loadAllBusinesses(): void {
        this.isLoading = true;
        this.apiService.getBusinesses().subscribe({
            next: (data) => {
                this.pendingCount = data.filter(b => b.templateStatus === 'PENDING').length;
                this.allBusinesses = data;
                this.filterBusinesses();
                this.isLoading = false;
            },
            error: (err) => {
                this.errorMessage = 'Failed to load businesses. You might not have admin permissions.';
                this.isLoading = false;
            }
        });
    }


    filterBusinesses(): void {
        let filtered = [...this.allBusinesses];

        // Filter by Status
        if (!this.showAll) {
            filtered = filtered.filter(b => b.templateStatus === 'PENDING');
        }

        // Filter by Search Text
        if (this.searchText) {
            const search = this.searchText.toLowerCase();
            filtered = filtered.filter(b =>
                b.businessName.toLowerCase().includes(search) ||
                b.businessId.toString().includes(search)
            );
        }

        this.businesses = filtered.sort((a, b) => {
            const order: any = { 'PENDING': 0, 'MISSING': 1, 'ACTIVE': 2 };
            return (order[a.templateStatus || 'MISSING'] ?? 1) - (order[b.templateStatus || 'MISSING'] ?? 1);
        });
    }

    onSearch(event: any): void {
        this.searchText = event.target.value;
        this.filterBusinesses();
    }

    toggleShowAll(): void {
        this.showAll = !this.showAll;
        this.filterBusinesses();
    }

    getStatusClass(status: string | undefined): string {
        if (!status) return 'status-missing';
        return `status-${status.toLowerCase()}`;
    }

    onFileSelected(event: any, businessId: number): void {
        const file = event.target.files[0];
        if (file) {
            if (file.type !== 'application/pdf') {
                alert('Please upload the processed PDF template for this business.');
                return;
            }
            this.uploadProcessedTemplate(businessId, file);
        }
    }

    uploadProcessedTemplate(businessId: number, file: File): void {
        this.isUploading = true;
        this.selectedBusinessId = businessId;
        this.apiService.uploadTemplate(businessId, file).subscribe({
            next: () => {
                this.isUploading = false;
                this.selectedBusinessId = null;
                this.successMessage = 'Processed template uploaded successfully!';
                this.loadAllBusinesses();
                setTimeout(() => this.successMessage = null, 3000);
            },
            error: (err) => {
                this.isUploading = false;
                this.selectedBusinessId = null;
                this.errorMessage = 'Failed to upload processed template.';
                setTimeout(() => this.errorMessage = null, 3000);
            }
        });
    }

    viewRawTemplate(businessId: number): void {
        this.apiService.checkTemplateExists(businessId).subscribe({
            next: (blob: Blob) => {
                const url = window.URL.createObjectURL(blob);
                window.open(url, '_blank');
            },
            error: (err) => {
                console.error('Error viewing template:', err);
                alert('Could not retrieve the template image. Please try again.');
            }
        });
    }

    onQuickFileSelected(event: any): void {
        const busId = Number(this.quickBusinessId);
        if (!busId) {
            alert('Please select a business first.');
            return;
        }
        const file = event.target.files[0];
        if (file) {
            if (file.type !== 'application/pdf') {
                alert('Please upload the processed PDF template for this business.');
                return;
            }
            this.uploadProcessedTemplate(busId, file);
            // Reset input
            event.target.value = '';
        }
    }

    onQuickSearchChange(event: any): void {
        const val = event.target.value;
        const match = val.match(/\(ID: (\d+)\)/);
        if (match && match[1]) {
            this.quickBusinessId = Number(match[1]);
        } else {
            const bus = this.allBusinesses.find(b => b.businessName === val);
            this.quickBusinessId = bus ? bus.businessId : null;
        }
        this.filterBusinesses();
    }

    getQuickBusinessName(): string {
        if (!this.quickBusinessId) return '';
        const bus = this.allBusinesses.find(b => b.businessId === this.quickBusinessId);
        return bus ? `${bus.businessName} (ID: ${bus.businessId})` : '';
    }
}
