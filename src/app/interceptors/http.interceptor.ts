import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpHeaders,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

@Injectable()
export class HttpRequestInterceptor implements HttpInterceptor {
  constructor(@Inject(PLATFORM_ID) private platformId: object) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Create headers
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });

    // Get token directly from localStorage to avoid circular dependency
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('oommeToken');
      if (token) {
        headers = headers.set('Authorization', `Bearer ${token}`);
      }
    }

    // Clone the request and add headers
    const modifiedRequest = request.clone({
      headers,
    });

    console.log('Outgoing request headers:', modifiedRequest.headers.keys());
    return next.handle(modifiedRequest);
  }
}
