import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import { AgGridAngular } from 'ag-grid-angular';
import {
  ColDef,
  GridApi,
  GridReadyEvent,
  ICellRendererParams,
  ModuleRegistry,
  AllCommunityModule,
  themeQuartz
} from 'ag-grid-community';
import { ApiService } from '../../services/api.service';
import { Business } from '../../models/invoice.model';

// Register all AG Grid Community modules once
ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
  selector: 'app-admin-subscriptions',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AgGridAngular],
  templateUrl: './admin-subscriptions.html',
  styleUrl: './admin-subscriptions.scss',
  providers: [DatePipe]
})
export class AdminSubscriptionsComponent implements OnInit {
  subscriptionForm: FormGroup;
  businesses: Business[] = [];
  subscriptionPlans: any[] = [];
  subscriptions: any[] = [];

  isLoading = false;
  isListLoading = false;
  isEditMode = false;
  editingSubscriptionId: number | null = null;

  successMessage = '';
  errorMessage = '';

  // ── AG Grid ────────────────────────────────────────────────────────────────
  private gridApi!: GridApi;

  /** AG Grid Quartz theme (light) */
  readonly gridTheme = themeQuartz;

  /** Column definitions */
  colDefs: ColDef[] = [];

  /** Default column settings */
  defaultColDef: ColDef = {
    sortable: true,
    filter: true,
    resizable: true,
    minWidth: 80,
  };

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private datePipe: DatePipe
  ) {
    this.subscriptionForm = this.fb.group({
      businessId: ['', Validators.required],
      subscriptionPlanId: ['', Validators.required],
      subscriptionStartDate: ['', Validators.required],
      subscriptionEndDate: ['', Validators.required],
      subscriptionStatus: [true],
      autoRenew: [true]
    });
  }

  ngOnInit(): void {
    this.buildColDefs();
    this.fetchData();
  }

  // ── Column Definitions ─────────────────────────────────────────────────────
  private buildColDefs(): void {
    this.colDefs = [
      {
        headerName: '#ID',
        field: 'subscriptionId',
        width: 80,
        pinned: 'left',
        cellRenderer: (p: ICellRendererParams) =>
          `<span class="ag-id-badge">#${p.value}</span>`
      },
      {
        headerName: 'Business',
        field: 'businessId',
        flex: 1,
        minWidth: 160,
        cellRenderer: (p: ICellRendererParams) => {
          const name = this.getBusinessName(p.value);
          return `<div class="ag-cell-main">${name}</div><div class="ag-cell-sub">ID: ${p.value}</div>`;
        }
      },
      {
        headerName: 'Plan',
        field: 'subscriptionPlanId',
        flex: 1,
        minWidth: 140,
        cellRenderer: (p: ICellRendererParams) =>
          `<span class="ag-plan-badge">${this.getPlanName(p.value)}</span>`
      },
      {
        headerName: 'Start Date',
        field: 'subscriptionStartDate',
        flex: 1,
        minWidth: 120,
        cellRenderer: (p: ICellRendererParams) =>
          `<span class="ag-date-start"><i class="fas fa-play-circle"></i> ${this.datePipe.transform(p.value, 'dd MMM yyyy') ?? '-'}</span>`
      },
      {
        headerName: 'End Date',
        field: 'subscriptionEndDate',
        flex: 1,
        minWidth: 120,
        cellRenderer: (p: ICellRendererParams) =>
          `<span class="ag-date-end"><i class="fas fa-stop-circle"></i> ${this.datePipe.transform(p.value, 'dd MMM yyyy') ?? '-'}</span>`
      },
      {
        headerName: 'Status',
        field: 'subscriptionStatus',
        width: 110,
        cellRenderer: (p: ICellRendererParams) =>
          p.value
            ? `<span class="ag-status-badge status-active">Active</span>`
            : `<span class="ag-status-badge status-inactive">Inactive</span>`
      },
      {
        headerName: 'Auto Renew',
        field: 'autoRenew',
        width: 120,
        cellRenderer: (p: ICellRendererParams) =>
          p.value
            ? `<span class="ag-status-badge status-renew">Yes</span>`
            : `<span class="ag-status-badge status-no-renew">No</span>`
      },
      {
        headerName: 'Actions',
        field: 'subscriptionId',
        width: 160,
        pinned: 'right',
        sortable: false,
        filter: false,
        resizable: false,
        cellRenderer: (p: ICellRendererParams) => {
          const id = p.data.subscriptionId;
          return `
            <div class="ag-action-btns">
              <button class="ag-action-btn ag-edit-btn" data-id="${id}">
                <i class="fas fa-edit"></i> Edit
              </button>
              <button class="ag-action-btn ag-delete-btn" data-del-id="${id}">
                <i class="fas fa-trash-alt"></i> Delete
              </button>
            </div>`;
        },
        onCellClicked: (p) => {
          const target = p.event?.target as HTMLElement;
          const btn = target.closest('button');
          if (!btn) return;

          const editId = btn.getAttribute('data-id');
          const delId = btn.getAttribute('data-del-id');

          if (editId) this.editSubscription(p.data);
          if (delId) this.deleteSubscription(Number(delId));
        }
      }
    ];
  }

  onGridReady(event: GridReadyEvent): void {
    this.gridApi = event.api;
  }

  // ── Data Loading ───────────────────────────────────────────────────────────
  fetchData(): void {
    this.isLoading = true;
    this.isListLoading = true;

    this.apiService.getAdminBusinesses().subscribe({
      next: (businesses) => {
        this.businesses = businesses;
        this.refreshGridData();
      },
      error: (err) => {
        console.error('Failed to load businesses', err);
        this.errorMessage = 'Failed to load business records.';
      }
    });

    this.apiService.getSubscriptionPlans().subscribe({
      next: (plans) => {
        this.subscriptionPlans = plans;
        this.isLoading = false;
        this.refreshGridData();
      },
      error: (err) => {
        console.error('Failed to load plans', err);
        this.errorMessage = 'Failed to load subscription plans.';
        this.isLoading = false;
      }
    });

    this.loadSubscriptions();
  }

  loadSubscriptions(): void {
    this.isListLoading = true;
    this.apiService.getAllSubscriptions().subscribe({
      next: (subs) => {
        this.subscriptions = subs;
        this.isListLoading = false;
      },
      error: (err) => {
        console.error('Failed to load subscriptions', err);
        this.isListLoading = false;
      }
    });
  }

  /** Refresh the grid cell renderers that depend on businesses/plans lookup */
  private refreshGridData(): void {
    if (this.gridApi) {
      this.gridApi.refreshCells({ force: true });
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  getBusinessName(id: number): string {
    const business = this.businesses.find(b => b.businessId === id);
    return business ? business.businessName : `ID: ${id}`;
  }

  getPlanName(id: number): string {
    const plan = this.subscriptionPlans.find(p => p.subscriptionPlanId === id);
    return plan ? plan.subscriptionPlanName : `ID: ${id}`;
  }

  formatDateForInput(dateStr: string): string {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toISOString().slice(0, 16);
    } catch {
      return '';
    }
  }

  // ── CRUD Actions ───────────────────────────────────────────────────────────
  editSubscription(sub: any): void {
    this.isEditMode = true;
    this.editingSubscriptionId = sub.subscriptionId;

    this.subscriptionForm.patchValue({
      businessId: sub.businessId,
      subscriptionPlanId: sub.subscriptionPlanId,
      subscriptionStartDate: this.formatDateForInput(sub.subscriptionStartDate),
      subscriptionEndDate: this.formatDateForInput(sub.subscriptionEndDate),
      subscriptionStatus: sub.subscriptionStatus,
      autoRenew: sub.autoRenew
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEdit(): void {
    this.isEditMode = false;
    this.editingSubscriptionId = null;
    this.subscriptionForm.reset({ subscriptionStatus: true, autoRenew: true });
  }

  deleteSubscription(id: number): void {
    if (confirm('Are you sure you want to delete this subscription?')) {
      this.apiService.deleteSubscription(id).subscribe({
        next: () => {
          this.successMessage = 'Subscription deleted successfully.';
          this.loadSubscriptions();
          if (this.editingSubscriptionId === id) this.cancelEdit();
          this.hideAlerts();
        },
        error: (err) => {
          console.error(err);
          this.errorMessage = 'Failed to delete subscription.';
          this.hideAlerts();
        }
      });
    }
  }

  onSubmit(): void {
    if (this.subscriptionForm.invalid) {
      this.subscriptionForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.successMessage = '';
    this.errorMessage = '';

    const formValues = this.subscriptionForm.value;

    if (!formValues.subscriptionStartDate || !formValues.subscriptionEndDate) {
      this.errorMessage = 'Invalid start or end dates.';
      this.isLoading = false;
      return;
    }

    const payload = {
      ...formValues,
      businessId: Number(formValues.businessId),
      subscriptionPlanId: Number(formValues.subscriptionPlanId),
      subscriptionStartDate: new Date(formValues.subscriptionStartDate).toISOString(),
      subscriptionEndDate: new Date(formValues.subscriptionEndDate).toISOString()
    };

    if (this.isEditMode && this.editingSubscriptionId) {
      this.apiService.updateSubscription(this.editingSubscriptionId, payload).subscribe({
        next: () => {
          this.successMessage = 'Subscription successfully updated!';
          this.cancelEdit();
          this.loadSubscriptions();
          this.isLoading = false;
          this.hideAlerts();
        },
        error: (err) => {
          console.error('Failed to update subscription', err);
          this.errorMessage = err.error?.detail || 'Failed to update subscription.';
          this.isLoading = false;
        }
      });
    } else {
      this.apiService.createSubscription(payload).subscribe({
        next: () => {
          this.successMessage = 'Subscription successfully created!';
          this.cancelEdit();
          this.loadSubscriptions();
          this.isLoading = false;
          this.hideAlerts();
        },
        error: (err) => {
          console.error('Failed to create subscription', err);
          this.errorMessage = err.error?.detail || 'Failed to create subscription. Ensure this business does not already have one.';
          this.isLoading = false;
        }
      });
    }
  }

  hideAlerts(): void {
    setTimeout(() => {
      this.successMessage = '';
      this.errorMessage = '';
    }, 4000);
  }
}
