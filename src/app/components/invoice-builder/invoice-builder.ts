import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Business, InvoicePDFData } from '../../models/invoice.model';

@Component({
  selector: 'app-invoice-builder',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './invoice-builder.html',
  styleUrl: './invoice-builder.scss'
})
export class InvoiceBuilderComponent implements OnInit {
  invoiceForm: FormGroup;
  businesses: Business[] = [];
  isGenerating = false;
  previewUrl: string | null = null;
  isTemplatePending = false;
  isAdmin = false;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private router: Router
  ) {
    this.invoiceForm = this.fb.group({
      businessId: ['', Validators.required],
      invoiceNumber: ['', Validators.required],
      BookNo: ['', Validators.required],
      invoiceDate: [new Date().toISOString().split('T')[0], Validators.required],
      CustomerName: ['', Validators.required],
      customerPhone: ['', Validators.required],
      customerFullAddress: ['', Validators.required],
      invoiceAmount: [0, [Validators.required, Validators.min(0)]],
      amountinwords: ['', Validators.required],
      purpose: ['', Validators.required],
      paymentMode: ['Cash', Validators.required],
      paymentType: ['Full', Validators.required],
      billCollector: ['', Validators.required],
      Nazim: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadBusinesses();
    this.setupAutoAmountInWords();
    this.setupBusinessSelectionListener();
  }

  setupAutoAmountInWords(): void {
    this.invoiceForm.get('invoiceAmount')?.valueChanges.subscribe(value => {
      if (value !== null && value !== undefined && value >= 0) {
        this.invoiceForm.patchValue({
          amountinwords: this.convertToWords(value)
        }, { emitEvent: false });
      } else {
        this.invoiceForm.patchValue({ amountinwords: '' }, { emitEvent: false });
      }
    });
  }

  setupBusinessSelectionListener(): void {
    this.invoiceForm.get('businessId')?.valueChanges.subscribe(businessId => {
      if (businessId) {
        this.apiService.checkTemplateExists(Number(businessId)).subscribe({
          error: (err: any) => {
            if (err.status === 404 && !this.isAdmin) {
              this.router.navigate(['/upload-template', businessId]);
            }
          }
        });
      }
    });
  }

  convertToWords(amount: number): string {
    if (amount === 0) return 'Zero Only';

    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const scales = ['', 'Thousand', 'Million', 'Billion'];

    const convertGroup = (n: number): string => {
      let res = '';
      if (n >= 100) {
        res += ones[Math.floor(n / 100)] + ' Hundred ';
        n %= 100;
      }
      if (n >= 20) {
        res += tens[Math.floor(n / 10)] + ' ';
        n %= 10;
      }
      if (n > 0) {
        res += ones[n] + ' ';
      }
      return res;
    };

    let integerPart = Math.floor(amount);
    let decimalPart = Math.round((amount - integerPart) * 100);

    let result = '';
    let groupIdx = 0;

    if (integerPart === 0) {
      result = '';
    } else {
      while (integerPart > 0) {
        let group = integerPart % 1000;
        if (group > 0) {
          result = convertGroup(group) + scales[groupIdx] + ' ' + result;
        }
        integerPart = Math.floor(integerPart / 1000);
        groupIdx++;
      }
    }

    result = result.trim();
    if (decimalPart > 0) {
      result += (result ? ' and ' : '') + convertGroup(decimalPart).trim() + ' Cents';
    }

    return result + (result ? ' Only' : '');
  }

  loadBusinesses(): void {
    this.apiService.getCurrentUser().subscribe({
      next: (user: any) => {
        this.isAdmin = user.roles && user.roles.some((r: any) =>
          r.roleName && r.roleName.toLowerCase() === 'admin'
        );

        const businessObservable = this.isAdmin
          ? this.apiService.getBusinesses()
          : this.apiService.getUserBusinesses(user.userId);

        businessObservable.subscribe({
          next: (data: Business[]) => {
            this.businesses = data;
            if (data.length > 0) {
              const business = data[0];
              const businessId = business.businessId;
              this.invoiceForm.patchValue({ businessId });

              if (!this.isAdmin) {
                if (business.templateStatus === 'MISSING') {
                  this.router.navigate(['/upload-template', businessId]);
                } else {
                  this.isTemplatePending = business.templateStatus === 'PENDING';
                }
              } else {
                this.isTemplatePending = false;
              }
            } else if (!this.isAdmin) {
              // Forced redirect if no business found for non-admin
              this.router.navigate(['/create-business']);
            }
          },
          error: (err: any) => console.error('Error loading businesses:', err)
        });
      },
      error: (err: any) => console.error('Error loading current user:', err)
    });
  }

  generateInvoice(): void {
    if (this.invoiceForm.invalid) {
      this.invoiceForm.markAllAsTouched();
      return;
    }

    this.isGenerating = true;
    const formData = this.invoiceForm.value as InvoicePDFData;

    this.apiService.generateInvoice(formData).subscribe({
      next: (blob: Blob) => {
        this.isGenerating = false;
        const url = window.URL.createObjectURL(blob);
        this.previewUrl = url;

        // Auto download
        const link = document.createElement('a');
        link.href = url;
        link.download = `invoice_${formData.invoiceNumber}.pdf`;
        link.click();
      },
      error: (err: any) => {
        this.isGenerating = false;
        console.error('Error generating invoice:', err);
        alert('Failed to generate invoice. Please check if the backend is running.');
      }
    });
  }

  resetForm(): void {
    this.invoiceForm.reset({
      invoiceDate: new Date().toISOString().split('T')[0],
      paymentMode: 'Cash',
      paymentType: 'Full'
    });
    this.previewUrl = null;
  }
}
