import { NextResponse } from 'next/server'

/**
 * Sets pv_access and pv_refresh httpOnly cookies on a NextResponse.
 *
 * @param res - The NextResponse to set cookies on
 * @param accessToken - JWT access token
 * @param refreshToken - Opaque refresh token UUID
 * @param expiresIn - Access token expiry in seconds
 */
export function setAuthCookies(
  res: NextResponse,
  accessToken: string,
  refreshToken: string,
  expiresIn: number
): void {
  res.cookies.set('pv_access', accessToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    path: '/',
    maxAge: expiresIn,
  })
  // pv_refresh scoped to /api/auth/ so browser only sends it on BFF auth requests
  res.cookies.set('pv_refresh', refreshToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    path: '/api/auth/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  })
}

/**
 * Clears both auth cookies from a NextResponse by setting maxAge=0.
 */
export function clearAuthCookies(res: NextResponse): void {
  res.cookies.set('pv_access', '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    path: '/',
    maxAge: 0,
  })
  res.cookies.set('pv_refresh', '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    path: '/api/auth/',
    maxAge: 0,
  })
}
