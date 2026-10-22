import { NextRequest, NextResponse } from 'next/server'
import { setAuthCookies, clearAuthCookies } from '@/lib/auth'
import type { User } from '@/types/api'

interface RestEnvelope<T> {
  data: T
}

interface RefreshResponseData {
  access_token: string
  refresh_token: string
  expires_in: number
}

/**
 * Calls GET /users/me with the provided Bearer token.
 * Returns the response so the caller can inspect status and body.
 */
async function fetchUserMe(accessToken: string): Promise<Response> {
  return fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  })
}

/**
 * GET /api/auth/session
 *
 * Reads the pv_access cookie and returns the current user profile.
 * If the access token is expired (401) and a refresh token is present,
 * performs a token refresh, overwrites both cookies, and retries.
 * On any failure, clears both cookies and returns 401.
 *
 * Requirements: 2.4, 2.5, 2.6
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const accessToken = request.cookies.get('pv_access')?.value

  // No access token at all — return 401 immediately
  if (!accessToken) {
    return NextResponse.json({ message: 'Unauthenticated.' }, { status: 401 })
  }

  try {
    const meRes = await fetchUserMe(accessToken)

    // Happy path — valid access token
    if (meRes.ok) {
      const envelope: RestEnvelope<User> = await meRes.json()
      return NextResponse.json(envelope.data, { status: 200 })
    }

    // Access token expired — attempt refresh if we have a refresh token
    if (meRes.status === 401) {
      const refreshToken = request.cookies.get('pv_refresh')?.value

      if (!refreshToken) {
        // No refresh token available, clear cookies and 401
        const response = NextResponse.json({ message: 'Unauthenticated.' }, { status: 401 })
        clearAuthCookies(response)
        return response
      }

      // Call POST /auth/refresh
      const refreshRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      })

      if (!refreshRes.ok) {
        // Refresh failed — clear cookies and 401
        const response = NextResponse.json({ message: 'Unauthenticated.' }, { status: 401 })
        clearAuthCookies(response)
        return response
      }

      const refreshEnvelope: RestEnvelope<RefreshResponseData> = await refreshRes.json()
      const { access_token: newAccessToken, refresh_token: newRefreshToken, expires_in } =
        refreshEnvelope.data

      // Retry GET /users/me with the new access token
      const retryRes = await fetchUserMe(newAccessToken)

      if (!retryRes.ok) {
        // Even with a fresh token the request failed — clear and 401
        const response = NextResponse.json({ message: 'Unauthenticated.' }, { status: 401 })
        clearAuthCookies(response)
        return response
      }

      const retryEnvelope: RestEnvelope<User> = await retryRes.json()
      const response = NextResponse.json(retryEnvelope.data, { status: 200 })
      // Overwrite cookies with the new token pair
      setAuthCookies(response, newAccessToken, newRefreshToken, expires_in)
      return response
    }

    // Any other non-2xx status from GET /users/me
    const response = NextResponse.json({ message: 'Unauthenticated.' }, { status: 401 })
    clearAuthCookies(response)
    return response
  } catch {
    const response = NextResponse.json({ message: 'Something went wrong.' }, { status: 500 })
    clearAuthCookies(response)
    return response
  }
}
