import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  currentUser: any = null;
  isMobileMenuOpen = false;

  constructor(public apiService: ApiService, private router: Router) {
    this.apiService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  toggleMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMenu(): void {
    this.isMobileMenuOpen = false;
  }

  get isLoggedIn(): boolean {
    return !!this.apiService.getToken();
  }

  get isAdmin(): boolean {
    return this.apiService.checkIsAdmin(this.currentUser);
  }


  get initials(): string {
    if (!this.currentUser?.fullName) return 'U';
    return this.currentUser.fullName
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  logout(): void {
    this.apiService.logout();
    this.router.navigate(['/login']);
  }
}
