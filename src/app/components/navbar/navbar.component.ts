import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { SocialUser, SocialAuthService, GoogleLoginProvider } from '@abacritt/angularx-social-login';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: false,
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit {
  user: SocialUser | null = null;
  showDefaultProfile = false;

  constructor(
    private router: Router,
    private authService: SocialAuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const storedUser = localStorage.getItem('oommeUser');
      if (storedUser) {
        this.user = JSON.parse(storedUser);
      }
    }

    this.authService.authState.subscribe(user => {
      this.user = user;
      if (isPlatformBrowser(this.platformId)) {
        if (user) {
          localStorage.setItem('user', JSON.stringify(user));
        } else {
          localStorage.removeItem('user');
        }
      }
    });
  }

  onGoogleSignIn(user: any): void {
    this.user = user;
    localStorage.setItem('user', JSON.stringify(user));
  }

  logout(): void {
    this.authService.signOut();
    this.user = null;
    localStorage.removeItem('user');
    this.router.navigate(['/']);
  }

  onProfileImageError(): void {
    this.showDefaultProfile = true;
  }
}
