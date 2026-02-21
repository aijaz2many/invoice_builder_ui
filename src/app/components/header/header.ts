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

  constructor(public apiService: ApiService, private router: Router) {
    this.apiService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  get isLoggedIn(): boolean {
    return !!this.apiService.getToken();
  }

  get isAdmin(): boolean {
    return this.currentUser?.roles?.some((r: any) =>
      r.roleName && r.roleName.toLowerCase() === 'admin'
    ) || false;
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
