import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import {
  SocialUser,
  SocialAuthService,
  GoogleLoginProvider,
} from '@abacritt/angularx-social-login';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly STORAGE_KEY = 'oommeUser';

  user$: BehaviorSubject<SocialUser | null> = new BehaviorSubject<SocialUser | null>(null);

  constructor(
    private socialAuthService: SocialAuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Auto-load user on app start
    if (isPlatformBrowser(this.platformId)) {
      const savedUser = localStorage.getItem(this.STORAGE_KEY);
      if (savedUser) {
        this.user$.next(JSON.parse(savedUser));
      }
    }

    this.socialAuthService.authState.subscribe((user: SocialUser | null) => {
      if (user && isPlatformBrowser(this.platformId)) {
        this.user$.next(user);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
      }
    });
  }

  signInWithGoogle(): Promise<void> {
    return this.socialAuthService.signIn(GoogleLoginProvider.PROVIDER_ID).then(user => {
      this.user$.next(user);
      if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
      }
    });
  }

  logout(): void {
    this.socialAuthService.signOut();
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.STORAGE_KEY);
    }
    this.user$.next(null);
  }

  getCurrentUser(): SocialUser | null {
    return this.user$.value;
  }
}
