import { HttpClient } from "./http-client";
import { AuthenticationMethodType } from "../common/authentication";

export class AppClient {
  constructor(private http: HttpClient) {
    this.getApplicationInfo = this.getApplicationInfo.bind(this);
    this.getSpaConfiguration = this.getSpaConfiguration.bind(this);
  }

  public async getSpaConfiguration(): Promise<SpaConfiguration> {
    return await this.http.getWithoutAuth<SpaConfiguration>(`/api/App/GetSpaConfiguration`);
  }

  public async getApplicationInfo(): Promise<ApplicationInfo> {
    return await this.http.get<ApplicationInfo>(`/api/App/GetApplicationInfo`);
  }
}

export interface SpaConfiguration {
  url: string;
  msalClientId: string;
  msalAuthority: string;
  msalScopes: string[];
  authMethods: AuthenticationMethodType[];
  defaultAuthMethod: AuthenticationMethodType | null;
  isEmailConfirmationRequired: boolean;
}

export interface ApplicationInfo {
  version: string;
  userId: string;
  displayName: string;
}
