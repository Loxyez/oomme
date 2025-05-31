import { Component, OnDestroy, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { GoogleSigninButtonModule } from '@abacritt/angularx-social-login';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../../services/auth.service';

interface UserDisplay {
  name: string;
  photoUrl?: string;
}

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    GoogleSigninButtonModule,
  ],
})
export class NavbarComponent implements OnInit, OnDestroy {
  user: UserDisplay | null = null;
  showDefaultProfile = false;
  private authSub?: Subscription;

  constructor(
    private authService: AuthService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: object
  ) {}

  ngOnInit() {
    this.authSub = this.authService.user$.subscribe(user => {
      console.log('Navbar received user update:', user);
      if (user) {
        this.user = {
          name: user.name,
          photoUrl: user.picture, // backend sends picture instead of photoUrl
        };
        console.log('Set user display with photo URL:', this.user.photoUrl);
        // Reset showDefaultProfile when we get a new user
        this.showDefaultProfile = false;
      } else {
        this.user = null;
        this.showDefaultProfile = false;
      }
    });
  }

  ngOnDestroy() {
    if (this.authSub) {
      this.authSub.unsubscribe();
    }
  }

  onProfileImageError(): void {
    console.log('Profile image failed to load, URL was:', this.user?.photoUrl);
    this.showDefaultProfile = true;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
