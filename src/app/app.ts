import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from './components/header/header';
import { Footer } from './components/footer/footer';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Header, Footer],
  template: `
    <app-header></app-header>
    <main class="main-content">
      <router-outlet></router-outlet>
    </main>
    <app-footer></app-footer>
  `,
  styles: [`
    .main-content {
      padding-top: 72px; /* Fixed header offset */
      min-height: calc(100vh - 80px); /* Adjust for footer */
      display: flex;
      flex-direction: column;
    }
  `]
})
export class AppComponent {
  title = 'invoice-builder-ui';
}
