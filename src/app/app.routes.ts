import { Routes } from '@angular/router';
import { InvoiceBuilderComponent } from './components/invoice-builder/invoice-builder';
import { InvoiceListComponent } from './components/invoice-list/invoice-list';
import { LoginComponent } from './components/login/login';
import { SignupComponent } from './components/signup/signup';
import { ForgotPasswordComponent } from './components/forgot-password/forgot-password';
import { ResetPasswordComponent } from './components/reset-password/reset-password';
import { CreateBusinessComponent } from './components/create-business/create-business';
import { TemplateUploadComponent } from './components/template-upload/template-upload';
import { AdminTemplateManagerComponent } from './components/admin-template-manager/admin-template-manager';
import { AdminSubscriptionsComponent } from './components/admin-subscriptions/admin-subscriptions';
import { DashboardComponent } from './components/dashboard/dashboard';
import { PricingComponent } from './components/pricing/pricing';
import { HomeComponent } from './components/home/home';

export const routes: Routes = [
    { path: '', redirectTo: 'home', pathMatch: 'full' },
    { path: 'home', component: HomeComponent },
    { path: 'pricing', component: PricingComponent },
    { path: 'builder', component: InvoiceBuilderComponent },
    { path: 'invoices', component: InvoiceListComponent },
    { path: 'login', component: LoginComponent },
    { path: 'signup', component: SignupComponent },
    { path: 'forgot-password', component: ForgotPasswordComponent },
    { path: 'reset-password', component: ResetPasswordComponent },
    { path: 'create-business', component: CreateBusinessComponent },
    { path: 'upload-template/:id', component: TemplateUploadComponent },
    { path: 'admin/templates', component: AdminTemplateManagerComponent },
    { path: 'admin/subscriptions', component: AdminSubscriptionsComponent },
    { path: 'admin/dashboard', component: DashboardComponent },
    { path: '**', redirectTo: 'login' }
];
