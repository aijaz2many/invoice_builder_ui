import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, NavigationExtras } from '@angular/router';
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
  isTemplatePending = false;
  isTemplateMissing = false;
  isAdmin = false;
  selectedFile: File | null = null;
  isUploading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  scrollToUpload(): void {
    const el = document.getElementById('upload-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.errorMessage = null;
    }
  }

  uploadBusinessTemplate(): void {
    const businessId = this.invoiceForm.get('businessId')?.value;
    if (!this.selectedFile || !businessId) return;

    this.isUploading = true;
    this.errorMessage = null;

    this.apiService.uploadTemplate(Number(businessId), this.selectedFile).subscribe({
      next: () => {
        this.isUploading = false;
        this.isTemplateMissing = false;
        this.isTemplatePending = true;
        this.selectedFile = null;
        this.successMessage = 'Image uploaded! We will prepare your Professional PDF Template soon.';
        setTimeout(() => this.successMessage = null, 3000);
      },
      error: (err) => {
        this.isUploading = false;
        this.errorMessage = err.error?.detail || 'Failed to upload image. Please try again.';
      }
    });
  }

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
    this.setupAutoAmountInWords();
    this.setupBusinessSelectionListener();

    // Restore form data if returning from preview page
    const historyState = window.history.state as { formData?: InvoicePDFData };
    if (historyState?.formData) {
      this.restoreFormData(historyState.formData);
    } else {
      this.loadBusinesses();
    }
  }

  restoreFormData(data: InvoicePDFData): void {
    // Load businesses first (needed for dropdown), then patch all form values
    this.loadBusinesses(() => {
      this.invoiceForm.patchValue({
        businessId:           data.businessId,
        invoiceNumber:        data.invoiceNumber,
        BookNo:               data.BookNo,
        invoiceDate:          data.invoiceDate,
        CustomerName:         data.CustomerName,
        customerPhone:        data.customerPhone,
        customerFullAddress:  data.customerFullAddress,
        invoiceAmount:        data.invoiceAmount,
        amountinwords:        data.amountinwords,
        purpose:              data.purpose,
        paymentMode:          data.paymentMode,
        paymentType:          data.paymentType,
        billCollector:        data.billCollector,
        Nazim:                data.Nazim
      });
    });
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
          next: () => {
            this.isTemplateMissing = false;
            this.isTemplatePending = false; // If it exists, it's not missing or pending
          },
          error: (err: any) => {
            if (err.status === 404) {
              // Check if it's pending based on business data we already have
              const business = this.businesses.find(b => String(b.businessId) === String(businessId));
              this.isTemplateMissing = business?.templateStatus === 'MISSING';
              this.isTemplatePending = business?.templateStatus === 'PENDING';
            }
          }
        });

        // Auto-increment logic
        this.generateNextInvoiceNumber(Number(businessId));
      }
    });
  }

  generateNextInvoiceNumber(businessId: number): void {
    this.apiService.getBusinessInvoices(businessId).subscribe({
      next: (invoices: any[]) => {
        let maxNum = 0;
        let prefix = 'INVC'; // Default prefix (aaaa)
        
        let maxBookNoVal = 0;
        let latestBookNo = invoices.length > 0 ? (invoices[0].BookNo || '') : '';
        let maxBookNoStr = '';
        
        if (invoices && invoices.length > 0) {
          for (const inv of invoices) {
            // --- Invoice Number Logic ---
            const numStr = inv.invoiceNumber;
            if (numStr && numStr.includes('-')) {
              const parts = numStr.split('-');
              prefix = parts[0]; // Retain their custom prefix if they used one
              if (parts.length > 1) {
                const numPart = parseInt(parts[1], 10);
                if (!isNaN(numPart) && numPart > maxNum) {
                  maxNum = numPart;
                }
              }
            }
            
            // --- Book Number Logic ---
            const bStr = inv.BookNo || '';
            const bMatch = bStr.match(/\d+/);
            if (bMatch) {
              const bNum = parseInt(bMatch[0], 10);
              if (bNum > maxBookNoVal) {
                maxBookNoVal = bNum;
                maxBookNoStr = bStr;
              }
            }
          }
          
          // Fallback if no dashes were used previously
          if (maxNum === 0) {
            for (const inv of invoices) {
              const numStr = inv.invoiceNumber || '';
              const matches = numStr.match(/\d+/);
              if (matches) {
                const num = parseInt(matches[0], 10);
                if (!isNaN(num) && num > maxNum) {
                  maxNum = num;
                }
              }
            }
          }
        }

        const nextNum = maxNum + 1;
        // Format as aaaa-dddd
        const nextInvoiceStr = `${prefix}-${nextNum.toString().padStart(4, '0')}`;
        
        // Use maxBookNoStr if found, otherwise fallback to the most recent invoice's BookNo
        const finalBookNo = maxBookNoStr || latestBookNo || '1';
        
        this.invoiceForm.patchValue({ 
          invoiceNumber: nextInvoiceStr,
          BookNo: finalBookNo 
        });
      },
      error: (err) => {
        console.error('Failed to fetch invoices for auto-increment', err);
        this.invoiceForm.patchValue({ 
          invoiceNumber: 'INVC-0001',
          BookNo: '1'
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

  loadBusinesses(onLoaded?: () => void): void {
    this.apiService.getCurrentUser().subscribe({
      next: (user: any) => {
        this.isAdmin = this.apiService.checkIsAdmin(user);

        const userId = user.userId || user.user_id || user.id;
        const businessObservable = this.isAdmin
          ? this.apiService.getBusinesses()
          : this.apiService.getUserBusinesses(userId);

        businessObservable.subscribe({
          next: (data: Business[]) => {
            this.businesses = data;

            // Only auto-select first business if no callback (fresh load)
            if (!onLoaded && data.length > 0) {
              const business = data[0];
              const businessId = business.businessId;
              this.invoiceForm.patchValue({ businessId });

              if (!this.isAdmin) {
                if (business.templateStatus === 'MISSING') {
                  this.isTemplateMissing = true;
                  this.isTemplatePending = false;
                } else {
                  this.isTemplateMissing = false;
                  this.isTemplatePending = business.templateStatus === 'PENDING';
                }
              } else {
                this.isTemplateMissing = false;
                this.isTemplatePending = false;
              }
            } else if (!onLoaded && !this.isAdmin) {
              // Forced redirect if no business found for non-admin
              this.router.navigate(['/create-business']);
            }

            // Invoke callback after businesses are loaded
            if (onLoaded) {
              onLoaded();

              // Set template status for the restored businessId
              const restoredId = this.invoiceForm.get('businessId')?.value;
              const match = data.find(b => String(b.businessId) === String(restoredId));
              if (match && !this.isAdmin) {
                this.isTemplateMissing  = match.templateStatus === 'MISSING';
                this.isTemplatePending  = match.templateStatus === 'PENDING';
              }
            }
          },
          error: (err: any) => console.error('Error loading businesses:', err)
        });
      },
      error: (err: any) => console.error('Error loading current user:', err)
    });
  }

  previewInvoice(): void {
    if (this.invoiceForm.invalid) {
      this.invoiceForm.markAllAsTouched();
      return;
    }

    this.isGenerating = true;
    const formData = this.invoiceForm.value as InvoicePDFData;

    // Navigate to the full-page preview, passing form data via router state
    this.router.navigate(['/invoice-preview'], {
      state: { formData }
    });

    this.isGenerating = false;
  }

  resetForm(): void {
    const currentBusinessId = this.invoiceForm.get('businessId')?.value;
    
    this.invoiceForm.reset({
      businessId: currentBusinessId,
      invoiceDate: new Date().toISOString().split('T')[0],
      paymentMode: 'Cash',
      paymentType: 'Full'
    });
    
    if (currentBusinessId) {
      this.generateNextInvoiceNumber(Number(currentBusinessId));
    }
  }
}

