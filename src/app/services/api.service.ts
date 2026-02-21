import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, map, catchError, of, tap } from 'rxjs';
import { Business, Customer, InvoicePDFData, InvoiceResponse } from '../models/invoice.model';

@Injectable({
    providedIn: 'root'
})
export class ApiService {
    //private apiUrl = 'http://localhost:8000'; // Adjust based on your FastAPI server address
    private apiUrl = 'https://invoice-builder-xfuk.onrender.com';

    private currentUserSubject = new BehaviorSubject<any>(null);
    public currentUser$ = this.currentUserSubject.asObservable();

    constructor(private http: HttpClient) {
        if (this.getToken()) {
            this.refreshCurrentUser().subscribe();
        }
    }

    refreshCurrentUser(): Observable<any> {
        return this.getCurrentUser().pipe(
            tap(user => this.currentUserSubject.next(user)),
            catchError(err => {
                this.currentUserSubject.next(null);
                return of(null);
            })
        );
    }

    // Businesses
    getBusinesses(): Observable<Business[]> {
        return this.http.get<Business[]>(`${this.apiUrl}/businesses/`);
    }

    getBusiness(id: number): Observable<Business> {
        return this.http.get<Business>(`${this.apiUrl}/businesses/${id}`);
    }

    getCurrentUser(): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/users/me`);
    }

    getUserBusinesses(userId: number): Observable<Business[]> {
        return this.http.get<Business[]>(`${this.apiUrl}/businesses/user/${userId}`);
    }

    getBusinessTypes(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/businesses/types/`);
    }

    createBusiness(businessData: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/businesses/`, businessData);
    }

    createBusinessType(typeData: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/businesses/types/`, typeData);
    }

    // Customers
    getCustomers(): Observable<Customer[]> {
        return this.http.get<Customer[]>(`${this.apiUrl}/customers/`);
    }

    // PDF Generation
    generateInvoice(data: InvoicePDFData): Observable<Blob> {
        return this.http.post(`${this.apiUrl}/pdf/generate-invoice`, data, {
            responseType: 'blob'
        });
    }

    // Authentication
    login(credentials: any): Observable<any> {
        // FastAPI OAuth2PasswordRequestForm expects form-data
        const body = new URLSearchParams();
        body.set('username', credentials.emailId);
        body.set('password', credentials.password);

        return this.http.post(`${this.apiUrl}/auth/token`, body.toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
    }

    signup(userData: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/auth/signup`, userData);
    }

    forgotPassword(email: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/auth/forgot-password`, { emailId: email });
    }

    resetPassword(data: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/auth/reset-password`, data);
    }

    saveToken(token: string): void {
        localStorage.setItem('auth_token', token);
    }

    getToken(): string | null {
        return localStorage.getItem('auth_token');
    }

    logout(): void {
        localStorage.removeItem('auth_token');
        this.currentUserSubject.next(null);
    }

    // Invoices
    getInvoices(): Observable<InvoiceResponse[]> {
        return this.http.get<InvoiceResponse[]>(`${this.apiUrl}/invoices/`);
    }

    getUserInvoices(userId: number): Observable<InvoiceResponse[]> {
        return this.http.get<InvoiceResponse[]>(`${this.apiUrl}/invoices/user/${userId}`);
    }

    getBusinessInvoices(businessId: number): Observable<InvoiceResponse[]> {
        return this.http.get<InvoiceResponse[]>(`${this.apiUrl}/invoices/business/${businessId}`);
    }

    uploadTemplate(businessId: number, file: File): Observable<any> {
        const formData = new FormData();
        formData.append('file', file);
        return this.http.post(`${this.apiUrl}/pdf/upload-template/${businessId}`, formData);
    }

    checkTemplateExists(businessId: number): Observable<any> {
        return this.http.get(`${this.apiUrl}/pdf/template/${businessId}`, { responseType: 'blob' });
    }

    deleteInvoice(invoiceId: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/invoices/${invoiceId}`);
    }

    getAdminStats(): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/admin/stats`);
    }
}
