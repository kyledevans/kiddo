import { HttpClient } from "./http-client";

export class EntryClient {
  constructor(private http: HttpClient) {
    this.getEntry = this.getEntry.bind(this);
    this.createEntry = this.createEntry.bind(this);
    this.updateEntry = this.updateEntry.bind(this);
    this.deleteEntries = this.deleteEntries.bind(this);
  }

  public async getEntry(entryId: number): Promise<Entry> {
    return await this.http.get<Entry>(`/api/Entry?entryId=${entryId}`);
  }

  public async createEntry(newEntry: Entry): Promise<Entry> {
    return await this.http.put<Entry>(`/api/Entry`, newEntry);
  }

  public async updateEntry(updateEntry: Entry): Promise<Entry> {
    return await this.http.post<Entry>(`/api/Entry`, updateEntry);
  }

  public async deleteEntries(entryIds: number[]): Promise<void> {
    return await this.http.post<void>(`/api/Entry/DeleteEntries`, entryIds);
  }
}

export interface Entry {
  entryId: number;
  accountId: number;
  currencyLookupId: number;
  userId: string;
  dateAddedUtc: string;
  value: number;
}
