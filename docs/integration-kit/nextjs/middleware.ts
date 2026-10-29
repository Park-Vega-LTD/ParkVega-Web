import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import type { AccessTokenClaims, UserRole } from '@park-vega/api-types';
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  REFRESH_MAX_AGE,
  accessMaxAge,
  baseCookieOptions,
  refreshSession,
} from './lib/session';

/**
 * Runs before every page, Server Action and Route Handler and does two jobs:
 *
 * 1. Refreshes the session. When the access cookie has expired but a
 *    refresh cookie remains, it rotates the pair once and writes both the
 *    response cookies (for the browser) and the request cookies (so the
 *    page rendering right now sees the new access token). This is the only
 *    place that refreshes; see lib/session.ts for why.
 *
 * 2. Gates sections. /account needs a session; /admin needs a staff or
 *    admin role, read from the verified access token. This is UX only: the
 *    API re-checks the role from its database on every request.
 *
 * Booking, checkout, /booking/<code> lookups and food orders are guest
 * flows and stay open.
 */

const SIGNED_IN_PREFIXES = ['/account'];
const STAFF_PREFIXES = ['/admin'];

const secret = process.env.JWT_SECRET
  ? new TextEncoder().encode(process.env.JWT_SECRET)
  : null;

async function roleOf(token: string | undefined): Promise<UserRole | null> {
  if (!token || !secret) return null;
  try {
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ['HS256'],
    });
    return (payload as unknown as AccessTokenClaims).role ?? null;
  } catch {
    return null;
  }
}

function clientIp(req: NextRequest): string | null {
  return req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip');
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  let access = req.cookies.get(ACCESS_COOKIE)?.value;
  const refresh = req.cookies.get(REFRESH_COOKIE)?.value;

  let refreshed: { access: string; refresh: string; expiresIn: number } | null =
    null;
  let clearSession = false;

  if (!access && refresh) {
    const result = await refreshSession(refresh, clientIp(req));
    if (result.ok) {
      const { access_token, refresh_token, expires_in } = result.session;
      refreshed = { access: access_token, refresh: refresh_token, expiresIn: expires_in };
      access = access_token;
      req.cookies.set(ACCESS_COOKIE, access_token);
      req.cookies.set(REFRESH_COOKIE, refresh_token);
    } else if (result.rejected) {
      clearSession = true;
      req.cookies.delete(REFRESH_COOKIE);
    }
  }

  let response: NextResponse;
  const needsSession = SIGNED_IN_PREFIXES.some((p) => pathname.startsWith(p));
  const needsStaff = STAFF_PREFIXES.some((p) => pathname.startsWith(p));

  if ((needsSession || needsStaff) && !access) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.search = '';
    url.searchParams.set('redirect', pathname);
    response = NextResponse.redirect(url);
  } else if (needsStaff && secret) {
    // Without JWT_SECRET the role can't be read here; the API still refuses
    // non-staff with a 403, which the admin pages handle.
    const role = await roleOf(access);
    response =
      role === 'staff' || role === 'admin'
        ? NextResponse.next({ request: { headers: req.headers } })
        : NextResponse.redirect(new URL('/', req.url));
  } else {
    // Passing the request headers on makes the cookies set above visible to
    // the Server Components and Actions handling this request.
    response = NextResponse.next({ request: { headers: req.headers } });
  }

  if (refreshed) {
    response.cookies.set(ACCESS_COOKIE, refreshed.access, {
      ...baseCookieOptions,
      maxAge: accessMaxAge(refreshed.expiresIn),
    });
    response.cookies.set(REFRESH_COOKIE, refreshed.refresh, {
      ...baseCookieOptions,
      maxAge: REFRESH_MAX_AGE,
    });
  } else if (clearSession) {
    response.cookies.delete(ACCESS_COOKIE);
    response.cookies.delete(REFRESH_COOKIE);
  }

  return response;
}

export const config = {
  // Everything except static assets, so sessions refresh before any page,
  // Server Action or Route Handler runs.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|txt|xml)$).*)'],
};
