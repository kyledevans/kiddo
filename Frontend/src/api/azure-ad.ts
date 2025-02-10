import { HttpClient } from "./http-client";

export class AzureAdClient {
  constructor(private http: HttpClient) {
    this.register = this.register.bind(this);
    this.registerManual = this.registerManual.bind(this);
    this.linkToExisting = this.linkToExisting.bind(this);
    this.removeLink = this.removeLink.bind(this);
    this.getAccountLinks = this.getAccountLinks.bind(this);
  }

  public async register(): Promise<RegisterResponse> {
    return await this.http.post<RegisterResponse>(`/api/AzureAd/Register`);
  }

  public async registerManual(manual: RegisterRequest): Promise<RegisterResponse> {
    return await this.http.post<RegisterResponse>(`/api/AzureAd/RegisterManual`, manual);
  }

  public async linkToExisting(accessToken: string): Promise<RegisterResponse> {
    // This is a bit strange in that we are swapping the access tokens.  The current authentication token is being placed in the request
    // payload while we use place the Azure AD JWT in the request headers.  The reason for this is that it was a pain to get the server-side
    // Microsoft Graph SDK to pull the authentication token from anywhere but the incoming HTTP request headers.

    if (this.http.tokenRenewal == null) throw new Error("Cannot link to an existing account because tokenRenewal() is null or undefined.");

    const currentAuthToken = await this.http.tokenRenewal();

    if (currentAuthToken == null) throw new Error("Cannot link to an existing account because tokenRenewal() returned null or undefined.");

    const request: LinkToExistingRequest = { accessToken };
    return await this.http.post<RegisterResponse>(`/api/AzureAd/LinkToExisting`, request);
  }

  public async removeLink(providerKey: string): Promise<void> {
    const request: RemoveLinkRequest = { providerKey };
    return await this.http.postEmpty(`/api/AzureAd/RemoveLink`, request);
  }

  public async getAccountLinks(): Promise<AccountLink[]> {
    return await this.http.get(`/api/AzureAd/GetAccountLinks`);
  }

  public async getAccountLinksByUserId(userId: string): Promise<AccountLink[]> {
    return await this.http.get(`/api/AzureAd/GetAccountLinksByUserId?userId=${encodeURIComponent(userId)}`);
  }
}

export interface RegisterRequest {
  displayName: string;
  givenName: string;
  surname: string;
  email: string;
}

export interface LinkToExistingRequest {
  accessToken: string;
}

export interface RegisterResponse {
  statusCode: RegisterStatusCodeType;
  userId: string | null;
  prefillData: RegisterPrefillData | null;
}

export interface RegisterPrefillData {
  displayName: string | null;
  givenName: string | null;
  surname: string | null;
  email: string | null;
}

/** Result codes for registration. */
export enum RegisterStatusCodeType {
  /** Success. */
  Success = 0,

  /** One or more of the profile fields retrieved from Microsoft Graph are unusable within the system.  This can indicate they are missing, empty, too long, or a malformed email address. */
  InvalidFields = 1,

  /** User is already registered. */
  AlreadyRegistered = 2,

  /** Email address is taken by an existing application user account, but they are unconfirmed so automatic linking was not possible. */
  EmailTakenUnverified = 3,

  /** Unknown error. */
  UnknownError = 4
}

export interface RemoveLinkRequest {
  providerKey: string;
}

export interface AccountLink {
  providerKey: string;
  graphId: string;
  displayName: string;
  givenName: string;
  surname: string;
  email: string;
}
