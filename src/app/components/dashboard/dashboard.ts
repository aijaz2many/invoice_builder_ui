import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { RouterModule } from '@angular/router';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './dashboard.html',
    styleUrl: './dashboard.scss'
})
export class DashboardComponent implements OnInit {
    private _invoiceCanvas!: ElementRef;
    private _templateCanvas!: ElementRef;

    @ViewChild('invoiceChart') set invoiceChart(content: ElementRef) {
        if (content) {
            this._invoiceCanvas = content;
            this.initInvoiceChart();
        }
    }

    @ViewChild('templateChart') set templateChart(content: ElementRef) {
        if (content) {
            this._templateCanvas = content;
            this.initTemplateChart();
        }
    }

    stats: any = {
        businesses: 0,
        invoices: 0,
        pendingTemplates: 0,
        missingTemplates: 0,
        users: 0,
        charts: {
            invoiceTimeline: [],
            templateDistribution: []
        }
    };
    isLoading = true;
    private invoiceChartInstance: any;
    private templateChartInstance: any;

    constructor(private apiService: ApiService) { }

    ngOnInit(): void {
        this.loadStats();
    }

    loadStats(): void {
        this.apiService.getAdminStats().subscribe({
            next: (data) => {
                this.stats = data;
                this.isLoading = false;
                // Re-initialize charts if data changes and canvases are already available
                this.initInvoiceChart();
                this.initTemplateChart();
            },
            error: (err) => {
                console.error('Error loading stats:', err);
                this.isLoading = false;
            }
        });
    }

    initInvoiceChart(): void {
        if (!this._invoiceCanvas || !this.stats.charts.invoiceTimeline.length) return;

        if (this.invoiceChartInstance) {
            this.invoiceChartInstance.destroy();
        }

        const ctx = this._invoiceCanvas.nativeElement.getContext('2d');
        const timelineData = this.stats.charts.invoiceTimeline;

        this.invoiceChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: timelineData.map((d: any) => {
                    const date = new Date(d.date);
                    return date.toLocaleDateString(undefined, { weekday: 'short' });
                }),
                datasets: [{
                    label: 'Invoices Generated',
                    data: timelineData.map((d: any) => d.count),
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: '#6366f1'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { color: '#f1f5f9' } },
                    x: { grid: { display: false } }
                }
            }
        });
    }

    initTemplateChart(): void {
        if (!this._templateCanvas || !this.stats.charts.templateDistribution.length) return;

        if (this.templateChartInstance) {
            this.templateChartInstance.destroy();
        }

        const ctx = this._templateCanvas.nativeElement.getContext('2d');
        const distData = this.stats.charts.templateDistribution;

        this.templateChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: distData.map((d: any) => d.label),
                datasets: [{
                    data: distData.map((d: any) => d.value),
                    backgroundColor: ['#16a34a', '#d97706', '#dc2626'],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20 } }
                },
                cutout: '70%'
            }
        });
    }
}
