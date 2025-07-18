import { environment } from './../environments/environment.development';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent],
})
export class AppComponent {
  constructor() {}
  title = 'oomme';
}
