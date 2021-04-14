import {HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {catchError, first, switchMap} from 'rxjs/operators';
import {BehaviorSubject, Observable, throwError} from 'rxjs';
import {AuthenticationService} from '../services/authentication.service';
import {AuthenticationResponse, MyError} from '../models/models';
import {API_URL, JWT_ACCESS_TOKEN_KEY} from '../constants/constants';

const AUTHENTICATION_URL = API_URL + 'authenticate';
const REFRESH_TOKEN_URL = API_URL + 'refreshtoken';

@Injectable()
export class RequestInterceptor implements HttpInterceptor {

  private isRefreshingJwtInProgress = false;
  private newJwtTokenSubject = new BehaviorSubject<string | null>(null);

  constructor(private authenticationService: AuthenticationService) { }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(this.addBearerToken(request)).pipe(
      catchError(err => {
        if (err.status === 401) {
          if (err.error.error && err.error.error.includes('ExpiredJwtException')) {
            return this.retryWithRefreshJwtToken(request, next);
          }
          return throwError(new MyError('Authentication error', err.status.toString()));
        }
        else if (err.status === 400) {
          if (err.error.error && err.error.error.includes('ExpiredRefreshJwtException')) {
            // should disconnect user because refresh token is expired
          }
          const message = err.error.message || err.message || err.error.error;
          return throwError(new MyError(message, err.status.toString()));
        } else {
          return throwError(new MyError('Server is unreachable', err.status.toString()));
        }
      })
    );
  }

  private addBearerToken(request: HttpRequest<any>): HttpRequest<any> {
    const isAuthenticationUrl = request.url.startsWith(AUTHENTICATION_URL) || request.url.startsWith(REFRESH_TOKEN_URL);
    const isApiUrl = request.url.startsWith(API_URL);
    if (isApiUrl && !isAuthenticationUrl) {
      const jwtAccessToken = localStorage.getItem(JWT_ACCESS_TOKEN_KEY);
      request = this.addJwtAuthorizationHeader(request, jwtAccessToken);
    }

    return request;
  }

  private retryWithRefreshJwtToken(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isRefreshingJwtInProgress) {
      this.isRefreshingJwtInProgress = true;
      this.newJwtTokenSubject.next(null);

      return this.authenticationService.refreshToken().pipe(
        switchMap((response: AuthenticationResponse) => {
          this.isRefreshingJwtInProgress = false;
          this.newJwtTokenSubject.next(response.jwtAccessToken);
          this.authenticationService.jwtAccessTokenSubject.next(response.jwtAccessToken); // refresh on screen
          return next.handle(this.addJwtAuthorizationHeader(request, response.jwtAccessToken)); // repeat failed request with new token
        })
      );
    } else {
      return this.newJwtTokenSubject.pipe( // wait while getting new token
        first(token => token !== null),
        switchMap(token =>
          next.handle(this.addJwtAuthorizationHeader(request, token)) // repeat failed request with new token
        )
      );
    }
  }

  private addJwtAuthorizationHeader(request: HttpRequest<any>, jwtAccessToken: string): HttpRequest<any> {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${jwtAccessToken}`,
      },
    });
  }

}
