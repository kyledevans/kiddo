export class HttpClient {
  private accessToken: string | null = null;
  public tokenRenewal: null | (() => Promise<string>) = null;

  constructor() {
    this.get = this.get.bind(this);
    this.put = this.put.bind(this);
    this.post = this.post.bind(this);
    this.postEmpty = this.postEmpty.bind(this);
    this.getWithoutAuth = this.getWithoutAuth.bind(this);
    this.createHeaders = this.createHeaders.bind(this);
  }

  public async getWithoutAuth<T>(url: string): Promise<T> {
    const headers = await this.createHeaders(true);

    const options: RequestInit = {
      method: "GET",
      headers: headers
    };

    const response = await fetch(url, options);
    const returnType = response.headers.get("Content-Type");
    if (returnType === "application/problem+json") {
      let parsed = response.json() as any;
      let problemError = new ProblemDetailsError(parsed);
      throw problemError;
    }
    return response.json();
  }

  public async get<T>(url: string): Promise<T> {
    const headers = await this.createHeaders();

    const options: RequestInit = {
      method: "GET",
      headers: headers
    };

    const response = await fetch(url, options);
    const returnType = response.headers.get("Content-Type");
    if (typeof returnType === "string" && returnType.indexOf("application/problem+json") >= 0) {
      let parsed = await response.json() as any;
      if (isProblemDetails(parsed)) {
        throw new ProblemDetailsError(parsed);
      } else {
        throw response;
      }
    } else {
      return response.json();
    }
  }

  public async put<T>(url: string, data?: any | undefined | null): Promise<T> {
    const headers = await this.createHeaders();

    const options: RequestInit = {
      method: "PUT",
      headers: headers
    };

    if (data != null) options.body = JSON.stringify(data);

    const response = await fetch(url, options);
    const returnType = response.headers.get("Content-Type");
    if (returnType === "application/problem+json") {
      let parsed = response.json() as any;
      let problemError = new ProblemDetailsError(parsed);
      throw problemError;
    }
    return response.json();
  }

  public async post<T>(url: string, data?: any | undefined | null): Promise<T> {
    const headers = await this.createHeaders();

    const options: RequestInit = {
      method: "POST",
      headers: headers
    };

    if (data != null) options.body = JSON.stringify(data);

    const response = await fetch(url, options);
    const returnType = response.headers.get("Content-Type");
    if (returnType === "application/problem+json") {
      let parsed = response.json() as any;
      let problemError = new ProblemDetailsError(parsed);
      throw problemError;
    }
    return response.json();
  }

  public async postCustomAuth<T>(url: string, jwtBearer?: string | undefined | null, data?: any | undefined | null, isEmptyResponse?: boolean | null | undefined): Promise<T> {
    const headers: HeadersInit = {
      "Accept": "application/json",
      "Content-Type": "application/json"
    };

    if (jwtBearer != null) headers["Authorization"] = `Bearer ${jwtBearer}`;

    const options: RequestInit = {
      method: "POST",
      headers: headers
    };

    if (data != null) options.body = JSON.stringify(data);

    const response = await fetch(url, options);
    const returnType = response.headers.get("Content-Type");
    if (returnType === "application/problem+json") {
      let parsed = response.json() as any;
      let problemError = new ProblemDetailsError(parsed);
      throw problemError;
    }
    if (isEmptyResponse === true) return (undefined as unknown) as T;
    else return response.json();
  }

  public async postAbortable<T>(url: string, jwtBearer?: string | undefined | null, data?: any | undefined | null, isEmptyResponse?: boolean | null | undefined, abortSignal?: AbortSignal): Promise<T> {
    const headers: HeadersInit = {
      "Accept": "application/json",
      "Content-Type": "application/json"
    };

    if (jwtBearer != null) headers["Authorization"] = `Bearer ${jwtBearer}`;

    const options: RequestInit = {
      method: "POST",
      headers: headers
    };

    if (data != null) options.body = JSON.stringify(data);

    if (abortSignal != null) options.signal = abortSignal;

    const response = await fetch(url, options);
    const returnType = response.headers.get("Content-Type");

    if (returnType === "application/problem+json") {
      let parsed = response.json() as any;
      let problemError = new ProblemDetailsError(parsed);
      throw problemError;
    }

    if (isEmptyResponse === true) {
      return (undefined as unknown) as T;
    }
    else {
      return await response.json();
    }
  }

  public async postEmpty(url: string, data?: any | undefined | null): Promise<void> {
    const headers = await this.createHeaders();

    const options: RequestInit = {
      method: "POST",
      headers: headers
    };

    if (data != null) options.body = JSON.stringify(data);

    const response = await fetch(url, options);
    const returnType = response.headers.get("Content-Type");
    if (returnType === "application/problem+json") {
      let parsed = response.json() as any;
      let problemError = new ProblemDetailsError(parsed);
      throw problemError;
    }
  }

  private async createHeaders(omitAuth?: boolean): Promise<HeadersInit> {
    omitAuth = omitAuth ?? false;

    const headers: HeadersInit = {
      "Accept": "application/json",
      "Content-Type": "application/json"
    };

    if (!omitAuth) {
      if (this.tokenRenewal != null) {
        this.accessToken = await this.tokenRenewal();
      }

      if (this.accessToken != null) {
        const bearer = `Bearer ${this.accessToken}`;
        headers["Authorization"] = bearer;
      }
    }

    return headers;
  }
}

export function isResponse(value: any | null | undefined): value is Response {
  if (value == null || typeof value !== "object") return false;
  else if ("status" in value) return true;
  else return false;
}

export class ProblemDetailsError<T extends ProblemDetails> extends Error implements ProblemDetails {
  public detail?: string;
  public instance?: string;
  public status?: number;
  public title?: string;
  public type: string;

  constructor(public response: T) {
    super(response.type);

    Object.assign(this, response);
    this.type = response.type;
  }
}

export interface ProblemDetails {
  detail?: string;
  instance?: string;
  status?: number;
  title?: string;
  type: string;
}

export type AbortableRequest<T> = { result: T, abort: () => void };

function isProblemDetails(val: any): val is ProblemDetails {
  if (val == null) return false;
  else if (typeof val === "object" && "type" in val) return true;
  else return false;
}
