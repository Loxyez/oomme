import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [RouterModule, MatButtonModule, MatIconModule],
  template: `
    <div class="unauthorized-container">
      <mat-icon class="error-icon">security</mat-icon>
      <h1>403</h1>
      <h2>Unauthorized Access</h2>
      <p>You don't have permission to access this page. Please log in or contact support.</p>
      <div class="button-group">
        <button mat-raised-button color="primary" routerLink="/">
          <mat-icon>home</mat-icon>
          Return Home
        </button>
        <button mat-raised-button color="accent" routerLink="/login">
          <mat-icon>login</mat-icon>
          Login
        </button>
      </div>
    </div>
  `,
  styles: [`
    .unauthorized-container {
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
      color: #ff9800;
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
      max-width: 400px;
    }
    .button-group {
      display: flex;
      gap: 16px;
      margin-top: 16px;
    }
  `]
})
export class UnauthorizedComponent {}
