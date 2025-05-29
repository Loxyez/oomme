import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterModule, MatButtonModule, MatIconModule],
  template: `
    <div class="not-found-container">
      <mat-icon class="error-icon">error_outline</mat-icon>
      <h1>404</h1>
      <h2>Page Not Found</h2>
      <p>The page you're looking for doesn't exist or has been moved.</p>
      <button mat-raised-button color="primary" routerLink="/">
        <mat-icon>home</mat-icon>
        Return Home
      </button>
    </div>
  `,
  styles: [`
    .not-found-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: calc(100vh - 64px);
      text-align: center;
      padding: 20px;
    }
    .error-icon {
      font-size: 64px;
      height: 64px;
      width: 64px;
      color: #f44336;
      margin-bottom: 16px;
    }
    h1 {
      font-size: 48px;
      margin: 0;
      color: #333;
    }
    h2 {
      margin: 8px 0;
      color: #666;
    }
    p {
      margin: 16px 0;
      color: #777;
    }
    button {
      margin-top: 16px;
    }
  `]
})
export class NotFoundComponent {}
