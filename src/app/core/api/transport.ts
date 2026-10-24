import { Injectable, inject } from '@angular/core';

/** A failed request, with the HTTP status. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message = `Request failed with status ${status}`,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface Request {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** Path under /api, e.g. `/recipes/r-1`. */
  path: string;
  query?: Record<string, string>;
  body?: unknown;
}

/** How API clients reach the backend. The app swaps in the mock backend. */
// A factory, because FetchTransport is declared below this class.
@Injectable({ providedIn: 'root', useFactory: () => inject(FetchTransport) })
export abstract class Transport {
  abstract send<T>(request: Request): Promise<T>;
}

/** The real thing: JSON over fetch. */
@Injectable({ providedIn: 'root' })
export class FetchTransport extends Transport {
  async send<T>({ method, path, query, body }: Request): Promise<T> {
    const url = `/api${path}${query ? `?${new URLSearchParams(query)}` : ''}`;
    const response = await fetch(url, {
      method,
      headers: body === undefined ? undefined : { 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!response.ok) throw new ApiError(response.status);
    return response.status === 204 ? (undefined as T) : ((await response.json()) as T);
  }
}
