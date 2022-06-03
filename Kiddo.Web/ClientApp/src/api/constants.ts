export enum SecurityRoleType {
  SuperAdministrator = 1,
  Administrator = 2,
  User = 3,
  ReadOnlyUser = 4
}

export const GuidEmpty: string = "00000000-0000-0000-0000-000000000000";

export abstract class ProblemDetailTypes {
  /** Base URI for all problem detail types. */
  public static readonly ProblemDetailTypesBaseUri = "error://kiddo.web/";  // Make sure this ends with a trailing slash.  Also make sure that changes here are replicated at the server level.

  public static readonly AuthenticationMethodNotEnabled = `${this.ProblemDetailTypesBaseUri}authentication-method-not-enabled`;
  public static readonly UserNotRegistered = `${this.ProblemDetailTypesBaseUri}user-not-registered`;
  public static readonly EmailNotConfirmed = `${this.ProblemDetailTypesBaseUri}email-not-confirmed`;
}
