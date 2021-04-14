import {Component, OnDestroy} from '@angular/core';
import {Subscription} from 'rxjs';
import {AuthenticationResponse, MyError} from './models/models';
import {FormBuilder, FormGroup} from '@angular/forms';
import {AuthenticationService} from './services/authentication.service';
import {first} from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnDestroy {
  jwtAccessToken$ = this.authenticationService.jwtAccessToken$;
  infoMessage = '';
  errorMessage = '';
  subscription: Subscription;
  loginForm: FormGroup;

  constructor(private authenticationService: AuthenticationService, private formBuilder: FormBuilder) {
    this.loginForm = formBuilder.group({
      username: [''],
      password: [''],
    });
  }

  authenticate(): void {
    this.errorMessage = '';
    this.infoMessage = '';
    this.subscription = this.authenticationService.authenticate({...this.loginForm.value}).pipe(first()).subscribe(
      (response: AuthenticationResponse) => this.infoMessage = 'Authentication success',
      (error: MyError) => this.errorMessage = error.message
    );
  }

  testToken(): void {
    this.errorMessage = '';
    this.infoMessage = '';
    this.subscription = this.authenticationService.testToken().subscribe(
      (response: string) => this.infoMessage = response,
      (error: MyError) => this.errorMessage = error.message
    );
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}
