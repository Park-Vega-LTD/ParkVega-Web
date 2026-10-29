import { NextRequest, NextResponse } from 'next/server'
import { API_URL } from '@/lib/api-url'
import { apiHeaders } from '@/lib/forwarded'
import { clearAuthCookies } from '@/lib/auth'
import { ACCESS_COOKIE } from '@/lib/session-cookies'
import type { User } from '@/types/api'

interface RestEnvelope<T> {
  data: T
}

/**
 * GET /api/auth/session
 *
 * Reads the pv_access cookie and returns the current user profile. The proxy
 * has already refreshed an expired session before this runs, so a 401 from
 * the API here means the session is over (revoked or deactivated): both
 * cookies are cleared and 401 returned.
 *
 * Requirements: 2.4, 2.5, 2.6
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value

  if (!accessToken) {
    return NextResponse.json({ message: 'Unauthenticated.' }, { status: 401 })
  }

  try {
    const meRes = await fetch(`${API_URL}/users/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        ...apiHeaders(request.headers),
      },
    })

    if (meRes.ok) {
      const envelope: RestEnvelope<User> = await meRes.json()
      return NextResponse.json(envelope.data, { status: 200 })
    }

    const response = NextResponse.json({ message: 'Unauthenticated.' }, { status: 401 })
    clearAuthCookies(response)
    return response
  } catch {
    // The API is unreachable: keep the cookies so the session survives.
    return NextResponse.json({ message: 'Something went wrong.' }, { status: 500 })
  }
}
