export interface AuthenticationRequest {
  username: string;
  password: string;
}

export interface AuthenticationResponse {
  jwtAccessToken: string;
}

export class MyError {
  constructor(public message: string, public status: string) { }
}

