import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, throwError, take } from 'rxjs';
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
      const savedUser = localStorage.getItem(this.STORAGE_KEY);

      if (savedToken && savedUser) {
        console.log('Restoring session from localStorage');
        // Restore saved state
        this.token$.next(savedToken);
        this.user$.next(JSON.parse(savedUser));

        // Try to refresh profile
        this.fetchUserProfile().subscribe({
          next: () => console.log('Session restored successfully'),
          error: error => {
            console.error('Error restoring session:', error);
            if (error.status === 401) {
              console.warn('Token expired, attempting silent login');
              this.attemptSilentLogin();
            }
          },
        });
      } else {
        console.log('No session found, attempting silent login');
        this.attemptSilentLogin();
      }
    }

    // Listen for social auth changes
    this.socialAuthService.authState.subscribe((socialUser: SocialUser | null) => {
      console.log('Social auth state changed:', socialUser ? 'logged in' : 'logged out');
      if (socialUser && isPlatformBrowser(this.platformId)) {
        this.loginWithBackend(socialUser);
      }
    });
  }

  private attemptSilentLogin(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    console.log('Attempting silent login');
    this.socialAuthService.authState.pipe(take(1)).subscribe(user => {
      if (user) {
        console.log('Silent login successful, logging in with backend');
        this.loginWithBackend(user);
      } else {
        console.log('No active Google session found');
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

          // Store token
          this.token$.next(token);
          if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem(this.TOKEN_KEY, token);
          }

          // Store initial user data while we fetch the full profile
          const initialUserData: UserProfile = {
            id: '',
            email: loginData.email,
            name: loginData.name,
            picture: loginData.picture,
          };
          this.user$.next(initialUserData);
          if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(initialUserData));
          }
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
        // Validate profile data
        if (!profile.picture) {
          console.warn('Profile missing picture URL');
          // Try to get picture from cached data
          if (isPlatformBrowser(this.platformId)) {
            const cachedUser = localStorage.getItem(this.STORAGE_KEY);
            if (cachedUser) {
              const userData = JSON.parse(cachedUser);
              profile.picture = userData.picture || '';
            }
          }
        }

        // Store and emit profile
        this.user$.next(profile);
        if (isPlatformBrowser(this.platformId) && profile) {
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(profile));
        }
      }),
      catchError(error => {
        console.error('Error fetching profile:', error);
        // On error, try to use cached user data
        if (isPlatformBrowser(this.platformId)) {
          const cachedUser = localStorage.getItem(this.STORAGE_KEY);
          if (cachedUser) {
            const userData = JSON.parse(cachedUser);
            console.log('Using cached user data:', userData);
            this.user$.next(userData);
          }
        }
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
    // Clear state first
    this.token$.next(null);
    this.user$.next(null);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.STORAGE_KEY);
    }
    // Then sign out of social auth
    this.socialAuthService.signOut().catch(error => {
      console.error('Error during sign out:', error);
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
