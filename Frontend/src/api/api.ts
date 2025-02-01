import { EntryClient } from "./entry";
import { LookupTypeClient } from "./lookup-type";
import { UserClient } from "./user";
import { AccountClient } from "./account";
import { HttpClient } from "./http-client";
import { AppClient } from "./app";
import { ProfileClient } from "./profile";
import { IdentityClient } from "./identity";
import { AzureAdClient } from "./azure-ad";

export class ApiClient {
  private http: HttpClient = new HttpClient();
  public entry: EntryClient = new EntryClient(this.http);
  public lookupType: LookupTypeClient = new LookupTypeClient(this.http);
  public user: UserClient = new UserClient(this.http);
  public account: AccountClient = new AccountClient(this.http);
  public app: AppClient = new AppClient(this.http);
  public profile: ProfileClient = new ProfileClient(this.http);
  public identity: IdentityClient = new IdentityClient(this.http);
  public azureAd: AzureAdClient = new AzureAdClient(this.http);

  constructor() {
    this.setAccessTokenRenewer = this.setAccessTokenRenewer.bind(this);
  }

  public setAccessTokenRenewer(renewer: () => Promise<string>): void {
    this.http.tokenRenewal = renewer;
  }
}

export const Api = new ApiClient();
