import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './pricing.html',
  styleUrl: './pricing.scss',
})
export class PricingComponent implements OnInit {
  plans: any[] = [];
  loading: boolean = true;
  error: string = '';

  /** Desired display order for plan names (case-insensitive match) */
  private readonly planOrder = ['free trial', 'basic', 'standard', 'premium'];

  constructor(private apiService: ApiService) { }

  ngOnInit(): void {
    this.apiService.getSubscriptionPlans().subscribe({
      next: (data) => {
        this.plans = this.sortPlans(data);
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load subscription plans';
        this.loading = false;
        console.error('Error fetching plans:', err);
      }
    });
  }

  private sortPlans(plans: any[]): any[] {
    return [...plans].sort((a, b) => {
      const nameA = (a.subscriptionPlanName ?? '').toLowerCase();
      const nameB = (b.subscriptionPlanName ?? '').toLowerCase();
      const indexA = this.planOrder.findIndex(o => nameA.includes(o));
      const indexB = this.planOrder.findIndex(o => nameB.includes(o));
      const rankA = indexA === -1 ? this.planOrder.length : indexA;
      const rankB = indexB === -1 ? this.planOrder.length : indexB;
      return rankA - rankB;
    });
  }
}
