import { HttpClient } from "./http-client";

import { SecurityRoleType } from "./constants";

export class UserClient {
  constructor(private http: HttpClient) {
    this.searchUsers = this.searchUsers.bind(this);
    this.getUser = this.getUser.bind(this);
    this.createUser = this.createUser.bind(this);
    this.updateUser = this.updateUser.bind(this);
    this.deleteUsers = this.deleteUsers.bind(this);
  }

  public async searchUsers(): Promise<SearchUserResult> {
    return await this.http.get<SearchUserResult>(`/api/User/SearchUsers`);
  }

  public async getUser(userId: string): Promise<User> {
    return await this.http.get<User>(`/api/User?userId=${encodeURIComponent(userId)}`);
  }

  public async createUser(newUser: User): Promise<User> {
    return await this.http.put<User>(`/api/User`, newUser);
  }

  public async updateUser(update: User): Promise<User> {
    return await this.http.post<User>(`/api/User`, update);
  }

  public async deleteUsers(userIds: string[]): Promise<void> {
    return await this.http.postEmpty(`/api/User/DeleteUsers`, userIds);
  }
}

export interface User {
  userId: string;
  securityRole: SecurityRoleType;
  externalId: string | null;
  displayName: string;
  givenName: string | null;
  surname: string | null;
  email: string | null;
  isActive: boolean;
  hasPassword: boolean;
}

export interface SearchUserResult {
  users: SearchUser[];
  isOverMax: boolean;
}

export interface SearchUser {
  userId: string;
  displayName: string;
}
