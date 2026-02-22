import { Component } from '@angular/core';
import { IonApp, IonContent, IonFooter, IonHeader, IonRouterOutlet } from '@ionic/angular/standalone';
import { Header } from './components/header/header';
import { Footer } from './components/footer/footer';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [IonApp, IonHeader, IonContent, IonFooter, IonRouterOutlet, Header, Footer],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class AppComponent {
  title = 'invoice-builder-ui';
}
