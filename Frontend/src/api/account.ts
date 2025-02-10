import { HttpClient } from "./http-client";

export class AccountClient {
  constructor(private http: HttpClient) {
    this.getAccount = this.getAccount.bind(this);
    this.searchAccounts = this.searchAccounts.bind(this);
    this.createAccount = this.createAccount.bind(this);
    this.updateAccount = this.updateAccount.bind(this);
    this.deleteAccounts = this.deleteAccounts.bind(this);
  }

  public async getAccount(accountId: number): Promise<Account> {
    return await this.http.get<Account>(`/api/Account?accountId=${accountId}`);
  }

  public async searchAccounts(): Promise<SearchAccountResult[]> {
    return await this.http.get<SearchAccountResult[]>(`/api/Account/SearchAccounts`);
  }

  public async createAccount(newAccount: Account): Promise<Account> {
    return await this.http.put<Account>(`/api/Account`, newAccount);
  }

  public async updateAccount(update: Account): Promise<Account> {
    return await this.http.post<Account>(`/api/Account`, update);
  }

  public async deleteAccounts(accountIds: number[]): Promise<void> {
    return await this.http.postEmpty(`/api/Account/DeleteAccounts`, accountIds);
  }
}

export interface SearchAccountResult {
  accountId: number;
  name: string;
  nameShort: string;
  description: string | null;
  currencies: AccountCurrencySummary[];
}

export interface Account {
  accountId: number;
  name: string;
  nameShort: string;
  description: string | null;
  currencies: AccountCurrencySummary[];
}

export interface AccountCurrencySummary {
  currencyLookupId: number;
  totalValue: number;
}
