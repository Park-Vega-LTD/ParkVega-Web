import type { ApiResponse, AuthSession } from '@park-vega/api-types';

/**
 * Session constants and the refresh call, shared by middleware (Edge runtime)
 * and server code. Nothing here may import `server-only` or `next/headers`.
 *
 * Why refreshing lives in middleware: the API rotates refresh tokens and
 * treats a reused one as theft, revoking every session for that user. A
 * Server Component cannot write cookies, so a refresh done during a render
 * would lose the rotated token and the next request would replay the old
 * one. Middleware runs before every page, Server Action and Route Handler
 * and can write cookies, so it is the one place that refreshes.
 */

export const ACCESS_COOKIE = 'pv_access';
export const REFRESH_COOKIE = 'pv_refresh';

export const API_URL = process.env.PARK_VEGA_API_URL ?? 'http://localhost:3000';

/** Matches the API's default JWT_REFRESH_EXPIRES of 7d. */
export const REFRESH_MAX_AGE = 7 * 24 * 60 * 60;

export const baseCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

/**
 * The access cookie expires a minute before the token does, so a present
 * cookie always holds a usable token and a missing one means "refresh".
 */
export function accessMaxAge(expiresIn: number): number {
  return Math.max(expiresIn - 60, 30);
}

export type RefreshResult =
  | { ok: true; session: AuthSession }
  /** The refresh token was rejected: clear the session. */
  | { ok: false; rejected: true }
  /** Network or server error: keep the cookies and try again later. */
  | { ok: false; rejected: false };

// Requests that arrive together carry the same refresh token. Sharing one
// in-flight call (and its result for a short while) stops them from each
// refreshing and tripping reuse detection. This is per server instance;
// see the README for multi-instance deployments.
const inFlight = new Map<string, Promise<RefreshResult>>();
const RESULT_TTL_MS = 30_000;

export function refreshSession(
  refreshToken: string,
  clientIp?: string | null,
): Promise<RefreshResult> {
  const existing = inFlight.get(refreshToken);
  if (existing) return existing;

  const promise = callRefresh(refreshToken, clientIp);
  inFlight.set(refreshToken, promise);
  promise.finally(() => {
    setTimeout(() => inFlight.delete(refreshToken), RESULT_TTL_MS);
  });
  return promise;
}

async function callRefresh(
  refreshToken: string,
  clientIp?: string | null,
): Promise<RefreshResult> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Correlation-ID': crypto.randomUUID(),
  };
  // /auth is limited to 10 requests a minute per IP; without this every
  // visitor's refresh would count against the proxy's own IP.
  if (clientIp) headers['X-Forwarded-For'] = clientIp;

  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ refresh_token: refreshToken }),
      cache: 'no-store',
    });
    if (res.status === 401) return { ok: false, rejected: true };
    if (!res.ok) return { ok: false, rejected: false };

    const body = (await res.json()) as ApiResponse<AuthSession>;
    if (body.success === false) return { ok: false, rejected: false };
    return { ok: true, session: body.data };
  } catch {
    return { ok: false, rejected: false };
  }
}
