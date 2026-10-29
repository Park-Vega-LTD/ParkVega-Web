import 'server-only';
import { headers as requestHeaders } from 'next/headers';
import type { ApiResponse } from '@park-vega/api-types';
import { ApiError } from './api-error';
import { API_URL } from './session';
import { getAccessToken } from './tokens';

/**
 * How a call authenticates:
 *  - 'none'     never sends a token. Use for public reads so they can be
 *               cached, and so staff don't get drafts on public pages.
 *  - 'optional' sends the token when signed in (links bookings and food
 *               orders to the user, unmasks their contact details).
 *  - 'required' throws a 401 ApiError up front when there is no session.
 */
export type AuthMode = 'none' | 'optional' | 'required';

interface RequestOptions extends Omit<RequestInit, 'body'> {
  /** JSON body, serialized automatically. */
  json?: unknown;
  /** Raw body, e.g. FormData for media uploads. */
  body?: BodyInit;
  /** Defaults to 'optional'. */
  auth?: AuthMode;
}

/**
 * Server-side typed API client for Server Components, Server Actions and
 * Route Handlers.
 *
 *  - attaches Authorization, X-Correlation-ID and the visitor's
 *    X-Forwarded-For (the API rate-limits per client IP)
 *  - unwraps the success envelope and returns `data`
 *  - throws ApiError on failure, including the API's 429s, which have no
 *    envelope
 *
 * It does not refresh tokens: middleware does that before the request runs
 * (see lib/session.ts). A 401 here means the session is gone, so send the
 * user to /login.
 */
export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { json, body, auth = 'optional', headers, ...init } = options;

  const finalHeaders = new Headers(headers);
  finalHeaders.set('X-Correlation-ID', crypto.randomUUID());
  if (json !== undefined) finalHeaders.set('Content-Type', 'application/json');

  const incoming = await requestHeaders();
  const clientIp =
    incoming.get('x-forwarded-for') ?? incoming.get('x-real-ip');
  if (clientIp) finalHeaders.set('X-Forwarded-For', clientIp);

  if (auth !== 'none') {
    const token = await getAccessToken();
    if (token) {
      finalHeaders.set('Authorization', `Bearer ${token}`);
    } else if (auth === 'required') {
      throw new ApiError(401, {
        errorCode: 'UNAUTHORIZED',
        message: 'Please sign in to continue.',
      });
    }
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: finalHeaders,
    body: json !== undefined ? JSON.stringify(json) : body,
    // Public reads may opt into caching with `next: { revalidate }`.
    cache: init.cache ?? (init.next ? undefined : 'no-store'),
  });

  // Logout and a few staff routes answer 204 with an empty body.
  if (res.status === 204) return undefined as T;

  if (res.status === 429) {
    const retryAfter = Number(
      res.headers.get('retry-after') ?? res.headers.get('ratelimit-reset'),
    );
    const text = await res.text();
    let message = 'Too many requests. Please wait a minute and try again.';
    try {
      message = (JSON.parse(text) as { message?: string }).message ?? message;
    } catch {
      // /auth answers with plain text
    }
    throw new ApiError(
      429,
      { errorCode: 'TOO_MANY_REQUESTS', message },
      Number.isFinite(retryAfter) ? retryAfter : undefined,
    );
  }

  let parsed: ApiResponse<T>;
  try {
    parsed = (await res.json()) as ApiResponse<T>;
  } catch {
    throw new ApiError(res.status, {
      errorCode: 'BAD_RESPONSE',
      message: 'Something went wrong. Please try again.',
    });
  }

  if (!res.ok || parsed.success === false) {
    throw new ApiError(
      res.status,
      parsed.success === false
        ? parsed
        : {
            errorCode: 'UNKNOWN',
            message: 'Something went wrong. Please try again.',
          },
    );
  }

  return parsed.data;
}
