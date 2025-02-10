import { HttpClient } from "./http-client";

export class ProfileClient {
  constructor(private http: HttpClient) {
    this.getProfile = this.getProfile.bind(this);
    this.updateProfile = this.updateProfile.bind(this);
    this.ensureProfile = this.ensureProfile.bind(this);
    this.getAuthorizationPolicies = this.getAuthorizationPolicies.bind(this);
    this.validateEmailForRegistration = this.validateEmailForRegistration.bind(this);
  }

  public getProfile(): Promise<Profile> {
    return this.http.get<Profile>(`/api/Profile`);
  }

  public async updateProfile(update: Profile): Promise<Profile> {
    return await this.http.post<Profile>(`/api/Profile`, update);
  }

  public async ensureProfile(): Promise<Profile> {
    return await this.http.post<Profile>(`/api/Profile/EnsureProfile`);
  }

  public async getAuthorizationPolicies(): Promise<PolicySummary> {
    return await this.http.get<PolicySummary>(`/api/Profile/GetAuthorizationPolicies`);
  }

  public async sendConfirmationEmail(email: string): Promise<void> {
    const request: SendConfirmationEmailRequest = { email };
    return await this.http.postEmpty(`/api/Profile/SendConfirmationEmail`, request);
  }

  public async confirmEmail(email: string | null, token: string): Promise<ConfirmEmailResponse> {
    const request: ConfirmEmailRequest = { email, token };
    return await this.http.post<ConfirmEmailResponse>(`/api/Profile/ConfirmEmail`, request);
  }

  public async validateEmailForRegistration(email: string, abortSignal: AbortSignal): Promise<ValidationResponse> {
    return await this.http.postAbortable<ValidationResponse>(`/api/Profile/ValidateEmailForRegistration?email=${encodeURIComponent(email)}`, null, null, null, abortSignal);
  }
}

export interface Profile {
  userId: string;
  givenName: string | null;
  surname: string | null;
  email: string | null;
  isEmailConfirmed: boolean;
  hasPassword: boolean;
  displayName: string;
  policies: PolicySummary;
}

export interface PolicySummary {
  isSuperAdministrator: boolean;
  isAdministrator: boolean;
  isUser: boolean;
  isReadOnlyUser: boolean;
  isAzureAd: boolean;
  isAspNetIdentity: boolean;
}

export interface SendConfirmationEmailRequest {
  email: string;
}

export interface ConfirmEmailRequest {
  email: string | null;
  token: string;
}

export interface ConfirmEmailResponse {
  success: boolean;
}

export interface ValidationResponse {
  isValid: boolean;
  errorCode: "InvalidEmail" | "EmailTaken" | string | null;
}
