import {AuthenticationRequest, AuthenticationResponse} from '../models/models';
import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {BehaviorSubject, Observable} from 'rxjs';
import {map, tap} from 'rxjs/operators';
import {API_URL, JWT_ACCESS_TOKEN_KEY} from '../constants/constants';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {

  jwtAccessTokenSubject = new BehaviorSubject<string | null>(null);
  jwtAccessToken$ = this.jwtAccessTokenSubject.asObservable();

  constructor(private http: HttpClient) { }

  authenticate(authenticationRequest: AuthenticationRequest): Observable<AuthenticationResponse> {
    return this.http.post<AuthenticationResponse>(API_URL + 'authenticate', authenticationRequest, {withCredentials: true}).pipe(
      tap(response => localStorage.setItem(JWT_ACCESS_TOKEN_KEY, response.jwtAccessToken)),
      tap(response => this.jwtAccessTokenSubject.next(response.jwtAccessToken))
    );
  }

  refreshToken(): Observable<AuthenticationResponse> {
    return this.http.get<AuthenticationResponse>(API_URL + 'refreshtoken', {withCredentials: true}).pipe(
      tap(response => localStorage.setItem(JWT_ACCESS_TOKEN_KEY, response.jwtAccessToken)),
      tap(response => this.jwtAccessTokenSubject.next(response.jwtAccessToken))
    );
  }

  testToken(): Observable<string> {
    return this.http.get<{ message: string }>(API_URL + 'hello').pipe(
      map(response => response.message)
    );
  }

}


