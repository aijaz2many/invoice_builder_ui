export interface Business {
  businessId: number;
  businessName: string;
  businessTypeId: number;
  userId: number;
  businessLogo?: string;
  businessAddress?: string;
  businessCity?: string;
  businessState?: string;
  businessCountry?: string;
  businessZip?: string;
  businessPhone?: string;
  businessEmail?: string;
  businessWebsite?: string;
  isActive: boolean;
  templateStatus?: string;
  createdOn: string;
}

export interface Customer {
  customerId?: number;
  businessId: number;
  customerName: string;
  customerPhone: string;
  customerFullAddress: string;
}

export interface InvoicePDFData {
  businessId: number;
  invoiceNumber: string;
  BookNo: string;
  invoiceDate: string;
  CustomerName: string;
  amountinwords: string;
  invoiceAmount: number;
  purpose: string;
  billCollector: string;
  Nazim: string;
  customerFullAddress: string;
  customerPhone: string;
  paymentMode: string;
  paymentType: string;
}

export interface InvoiceResponse {
  invoiceId: number;
  businessId: number;
  customerId: number;
  invoiceNumber: string;
  invoiceAmount: number;
  amountInWords: string;
  paymentMode: string;
  paymentType: string;
  purpose: string;
  pdfURL?: string;
  invoiceDate: string;
  createdOn: string;
}
