import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, throwError } from 'rxjs';
import {
  SocialUser,
  SocialAuthService,
  GoogleLoginProvider,
} from '@abacritt/angularx-social-login';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../environments/environment';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  picture: string;
}

interface LoginResponse {
  token?: string;
  access_token?: string;
  data?: {
    token?: string;
    access_token?: string;
  };
  [key: string]: string | number | boolean | object | undefined | null;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly STORAGE_KEY = 'oommeUser';
  private readonly TOKEN_KEY = 'oommeToken';
  private readonly API_URL = environment.API_V1;

  user$: BehaviorSubject<UserProfile | null> = new BehaviorSubject<UserProfile | null>(null);
  private token$ = new BehaviorSubject<string | null>(null);

  constructor(
    private socialAuthService: SocialAuthService,
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: object
  ) {
    // Auto-load user and token on app start
    if (isPlatformBrowser(this.platformId)) {
      const savedToken = localStorage.getItem(this.TOKEN_KEY);
      if (savedToken) {
        this.token$.next(savedToken);
        this.fetchUserProfile().subscribe({
          error: error => {
            console.error('Error fetching profile:', error);
            this.logout();
          },
        });
      }
    }

    this.socialAuthService.authState.subscribe((socialUser: SocialUser | null) => {
      if (socialUser && isPlatformBrowser(this.platformId)) {
        this.loginWithBackend(socialUser);
      }
    });
  }

  private getTokenFromResponse(response: LoginResponse): string | null {
    if (response.token) return response.token;
    if (response.access_token) return response.access_token;
    if (response.data?.token) return response.data.token;
    if (response.data?.access_token) return response.data.access_token;
    return null;
  }

  private handleError(error: HttpErrorResponse) {
    console.error('An error occurred:', error);
    if (error.status === 0) {
      console.error('Client-side or network error:', error.error);
    } else {
      console.error(`Backend returned code ${error.status}, body:`, error.error);
    }
    return throwError(() => error);
  }

  private loginWithBackend(socialUser: SocialUser): void {
    const loginData = {
      token: socialUser.idToken,
      email: socialUser.email,
      name: socialUser.name,
      picture: socialUser.photoUrl,
    };

    console.log('Attempting login with:', { ...loginData, token: '[REDACTED]' });

    this.http
      .post<LoginResponse>(`${this.API_URL}/auth/login`, loginData)
      .pipe(
        tap(response => {
          console.log('Received login response:', { ...response, token: '[REDACTED]' });
          const token = this.getTokenFromResponse(response);
          if (!token) {
            throw new Error('Invalid response format: no token found in response');
          }
          console.log('Login successful, received token');
          if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem(this.TOKEN_KEY, token);
          }
          this.token$.next(token);
        }),
        catchError(error => {
          console.error('Login failed:', error);
          this.logout();
          return this.handleError(error);
        })
      )
      .subscribe({
        next: () => {
          console.log('Token stored, fetching profile...');
          this.fetchUserProfile().subscribe({
            next: () => console.log('Profile fetch completed'),
            error: error => {
              console.error('Failed to fetch profile after login:', error);
              this.logout();
            },
          });
        },
        error: error => console.error('Login subscription error:', error),
      });
  }

  private fetchUserProfile(): Observable<UserProfile> {
    const token = this.getToken();
    console.log('Fetching user profile, token exists:', !!token);

    if (!token) {
      console.error('No token available for profile fetch');
      return throwError(() => new Error('No authentication token available'));
    }

    return this.http.get<UserProfile>(`${this.API_URL}/users/me`).pipe(
      tap(profile => {
        console.log('Profile fetched successfully:', profile);
        this.user$.next(profile);
      }),
      catchError(error => {
        console.error('Error fetching profile:', error);
        return this.handleError(error);
      })
    );
  }

  signInWithGoogle(): Promise<void> {
    return this.socialAuthService
      .signIn(GoogleLoginProvider.PROVIDER_ID)
      .then(socialUser => {
        this.loginWithBackend(socialUser);
      })
      .catch(error => {
        throw error;
      });
  }

  logout(): void {
    this.socialAuthService.signOut().finally(() => {
      if (isPlatformBrowser(this.platformId)) {
        localStorage.removeItem(this.TOKEN_KEY);
      }
      this.token$.next(null);
      this.user$.next(null);
    });
  }

  getCurrentUser(): UserProfile | null {
    return this.user$.value;
  }

  getToken(): string | null {
    return this.token$.value;
  }

  isLoggedIn(): boolean {
    return !!this.token$.value && !!this.user$.value;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}
