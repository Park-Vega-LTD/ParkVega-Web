import 'server-only';
import { cookies } from 'next/headers';
import type { AuthSession } from '@park-vega/api-types';
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  REFRESH_MAX_AGE,
  accessMaxAge,
  baseCookieOptions,
} from './session';

/**
 * Token storage: httpOnly, Secure, SameSite=Lax cookies that client-side
 * JavaScript can never read.
 *
 * `setTokens` and `clearTokens` write cookies, so call them only from Server
 * Actions and Route Handlers (Next.js forbids cookie writes during a Server
 * Component render). Refreshing is done by middleware, never here.
 */

export async function setTokens(session: AuthSession): Promise<void> {
  const store = await cookies();
  store.set(ACCESS_COOKIE, session.access_token, {
    ...baseCookieOptions,
    maxAge: accessMaxAge(session.expires_in),
  });
  store.set(REFRESH_COOKIE, session.refresh_token, {
    ...baseCookieOptions,
    maxAge: REFRESH_MAX_AGE,
  });
}

export async function getAccessToken(): Promise<string | undefined> {
  return (await cookies()).get(ACCESS_COOKIE)?.value;
}

export async function getRefreshToken(): Promise<string | undefined> {
  return (await cookies()).get(REFRESH_COOKIE)?.value;
}

export async function clearTokens(): Promise<void> {
  const store = await cookies();
  store.delete(ACCESS_COOKIE);
  store.delete(REFRESH_COOKIE);
}
