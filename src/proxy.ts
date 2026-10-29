import { jwtVerify } from 'jose'
import { NextRequest, NextResponse } from 'next/server'

import { safeNextPath } from '@/lib/auth-redirect'
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  REFRESH_MAX_AGE,
  accessMaxAge,
  baseCookieOptions,
  clearLegacyRefreshCookie,
  refreshSession,
} from '@/lib/session-cookies'

const JWT_SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET)

// Staff tools live in the separate parkvega-admin app; /admin and /staff
// redirect there (next.config.ts).
const PROTECTED = ['/my-bookings', '/my-day', '/account', '/ticket']
const AUTH_PAGES = ['/login', '/register']

/** `/ticket` covers `/ticket/ABC` but not the public `/tickets` page. */
function isUnder(path: string, prefix: string) {
  return path === prefix || path.startsWith(`${prefix}/`)
}

function redirect(req: NextRequest, destination: string) {
  const url = req.nextUrl.clone()
  url.pathname = destination.split('?')[0]
  url.search = destination.includes('?') ? destination.split('?')[1] : ''
  return NextResponse.redirect(url)
}

async function isValid(token: string | undefined) {
  if (!token) return false
  try {
    await jwtVerify(token, JWT_SECRET_KEY)
    return true
  } catch {
    // JWT invalid or expired
    return false
  }
}

/**
 * Runs before every page and Route Handler and does two jobs:
 *
 * 1. Refreshes the session. When the access cookie has gone but a refresh
 *    cookie remains, it rotates the pair once and writes it both to the
 *    response (for the browser) and to this request (so the page or Route
 *    Handler running now sees the new token). This is the only place that
 *    refreshes; see lib/session-cookies.ts for why.
 * 2. Gates the visitor dashboard and bounces signed-in visitors off the
 *    login and register pages.
 */
export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname
  let token = req.cookies.get(ACCESS_COOKIE)?.value
  const refreshToken = req.cookies.get(REFRESH_COOKIE)?.value

  let refreshed: { access: string; refresh: string; expiresIn: number } | null = null
  let clearSession = false

  if (refreshToken && !(await isValid(token))) {
    const result = await refreshSession(refreshToken, req.headers)
    if (result.ok) {
      const { access_token, refresh_token, expires_in } = result.tokens
      refreshed = { access: access_token, refresh: refresh_token, expiresIn: expires_in }
      token = access_token
      req.cookies.set(ACCESS_COOKIE, access_token)
      req.cookies.set(REFRESH_COOKIE, refresh_token)
    } else if (result.rejected) {
      clearSession = true
      token = undefined
      req.cookies.delete(ACCESS_COOKIE)
      req.cookies.delete(REFRESH_COOKIE)
    }
  }

  const signedIn = await isValid(token)
  let response: NextResponse

  if (PROTECTED.some((p) => isUnder(path, p)) && !signedIn) {
    response = redirect(req, `/login?next=${encodeURIComponent(path)}`)
  } else if (AUTH_PAGES.some((p) => isUnder(path, p)) && signedIn) {
    response = redirect(req, safeNextPath(req.nextUrl.searchParams.get('next')))
  } else {
    // Passing the request headers on makes the cookies set above visible to
    // the Server Components and Route Handlers handling this request.
    response = NextResponse.next({ request: { headers: req.headers } })
  }

  if (refreshed) {
    response.cookies.set(ACCESS_COOKIE, refreshed.access, {
      ...baseCookieOptions,
      maxAge: accessMaxAge(refreshed.expiresIn),
    })
    response.cookies.set(REFRESH_COOKIE, refreshed.refresh, {
      ...baseCookieOptions,
      maxAge: REFRESH_MAX_AGE,
    })
    clearLegacyRefreshCookie(response.headers)
  } else if (clearSession) {
    response.cookies.set(ACCESS_COOKIE, '', { ...baseCookieOptions, maxAge: 0 })
    response.cookies.set(REFRESH_COOKIE, '', { ...baseCookieOptions, maxAge: 0 })
    clearLegacyRefreshCookie(response.headers)
  }

  return response
}

export const config = {
  // Everything except build assets and static files, so sessions refresh
  // before any page or Route Handler runs. The payment webhook is skipped:
  // it is called by Flutterwave, never with a session.
  matcher: [
    '/((?!_next/static|_next/image|api/payments/webhook|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|txt|xml|mp4|webm)$).*)',
  ],
}
