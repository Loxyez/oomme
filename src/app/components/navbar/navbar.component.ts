import { Component, OnDestroy, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import {
  SocialAuthService,
  SocialUser,
  GoogleSigninButtonModule,
} from '@abacritt/angularx-social-login';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { isPlatformBrowser } from '@angular/common';

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
  user: SocialUser | null = null;
  showDefaultProfile = false;
  private authSub?: Subscription;

  constructor(
    private socialAuthService: SocialAuthService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      const storedUser = localStorage.getItem('oommeUser');
      if (storedUser) {
        this.user = JSON.parse(storedUser);
      }
    }

    this.authSub = this.socialAuthService.authState.subscribe(user => {
      this.user = user;
      this.showDefaultProfile = false;
      if (isPlatformBrowser(this.platformId)) {
        if (user) {
          localStorage.setItem('oommeUser', JSON.stringify(user));
        } else {
          localStorage.removeItem('oommeUser');
        }
      }
    });
  }

  ngOnDestroy() {
    if (this.authSub) {
      this.authSub.unsubscribe();
    }
  }

  onProfileImageError(): void {
    this.showDefaultProfile = true;
  }

  logout(): void {
    this.socialAuthService.signOut().then(() => {
      this.user = null;
      if (isPlatformBrowser(this.platformId)) {
        localStorage.removeItem('oommeUser');
      }
      this.router.navigate(['/']);
    });
  }
}
