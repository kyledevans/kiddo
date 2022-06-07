import { HttpClient } from "./http-client";

export class IdentityClient {
  constructor(private http: HttpClient) {
    this.authenticate = this.authenticate.bind(this);
    this.generateNewJwts = this.generateNewJwts.bind(this);
    this.getPasswordValidationRules = this.getPasswordValidationRules.bind(this);
    this.sendPasswordReset = this.sendPasswordReset.bind(this);
    this.passwordReset = this.passwordReset.bind(this);
    this.changePassword = this.changePassword.bind(this);
    this.removePassword = this.removePassword.bind(this);
  }

  public async register(email: string, password: string, displayName: string, givenName: string, surname: string): Promise<RegisterResponse> {
    const request: RegisterRequest = { email, password, displayName, givenName, surname };
    return await this.http.post<RegisterResponse>(`/api/Identity/Register`, request);
  }

  public async authenticate(username: string, password: string): Promise<AuthenticateResponse> {
    const authRequest: AuthenticateRequest = { username, password };
    return await this.http.post(`/api/Identity/Authenticate`, authRequest);
  }

  public async generateNewJwts(refreshToken: string): Promise<GenerateNewJwtsResponse> {
    return await this.http.postCustomAuth(`/api/Identity/GenerateNewJwts`, refreshToken);
  }

  public async getPasswordValidationRules(): Promise<PasswordValidationRules> {
    return await this.http.getWithoutAuth(`/api/Identity/GetPasswordValidationRules`);
  }

  public async sendPasswordReset(email: string): Promise<void> {
    const request: SendPasswordResetRequest = { email };
    return await this.http.postCustomAuth(`/api/Identity/SendPasswordReset`, null, request, true);
  }

  public async passwordReset(email: string, password: string, token: string): Promise<PasswordResetResponse> {
    const request: PasswordResetRequest = { email, password, token };
    return await this.http.postCustomAuth(`/api/Identity/PasswordReset`, null, request);
  }

  public async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const request: ChangePasswordRequest = { currentPassword, newPassword };
    return await this.http.postEmpty(`/api/Identity/ChangePassword`, request);
  }

  public async removePassword(): Promise<void> {
    return await this.http.postEmpty(`/api/Identity/RemovePassword`);
  }

  public async removePasswordByUserId(userId: string): Promise<void> {
    return await this.http.postEmpty(`/api/Identity/RemovePasswordByUserId?userId=${encodeURIComponent(userId)}`);
  }

  public async setPassword(newPassword: string): Promise<void> {
    const request: SetPasswordRequest = { newPassword };
    return await this.http.postEmpty(`/api/Identity/SetPassword`, request);
  }

  public async setPasswordByUserId(userId: string, newPassword: string): Promise<void> {
    const request: SetPasswordRequest = { newPassword };
    console.log(request);
    return await this.http.postEmpty(`/api/Identity/SetPasswordByUserId?userId=${encodeURIComponent(userId)}`, request);
  }
}

export interface AspNetUser {
  aspNetUserId: string;
  userName: string;
  email: string;
}

export interface AuthenticateRequest {
  username: string;
  password: string;
}

export interface AuthenticateResponse {
  success: boolean;
  refreshToken: string;
  accessToken: string;
}

export interface GenerateNewJwtsResponse {
  refreshToken: string;
  accessToken: string;
}

export interface PasswordValidationRules {
  requiredLength: number;
  requiredUniqueChars: number;
  requireNonAlphanumeric: boolean;
  requireLowercase: boolean;
  requireUppercase: boolean;
  requireDigit: boolean;
}

export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
  givenName: string;
  surname: string;
}

export interface RegisterResponse {
  success: boolean;
  authenticateResponse: AuthenticateResponse | null;
}

export interface SendPasswordResetRequest {
  email: string;
}

export interface PasswordResetRequest {
  email: string;
  password: string;
  token: string;
}

export interface PasswordResetResponse {
  success: boolean;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface SetPasswordRequest {
  newPassword: string;
}
