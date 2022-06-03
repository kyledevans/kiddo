import { HttpClient } from "./http-client";

export class LookupTypeClient {
  constructor(private http: HttpClient) {
    this.getLookupType = this.getLookupType.bind(this);
    this.updateLookupType = this.updateLookupType.bind(this);
  }

  public async getLookupType(lookupTypeId: number): Promise<LookupType> {
    return await this.http.get(`/api/LookupType?lookupTypeId=${lookupTypeId}`);
  }

  public async updateLookupType(lookupType: LookupType): Promise<LookupType> {
    return await this.http.post<LookupType>(`/api/LookupType`, lookupType);
  }
}

export interface LookupType {
  lookupTypeId: number;
  name: string;
  description: string;
  sortOrder: number;
  lookups: Lookup[];
}

export interface Lookup {
  lookupId: number;
  name: string;
  nameShort: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
}

export enum LookupTypeType {
  Zero = 0,
  Currency = 1,
  SecurityRole = 2
}
