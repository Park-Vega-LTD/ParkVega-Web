import { NextRequest, NextResponse } from 'next/server'
import { clearAuthCookies } from '@/lib/auth'

/**
 * POST /api/auth/logout
 *
 * Reads the pv_refresh cookie, calls POST /auth/logout on the REST API
 * with the refresh token (ignoring the result), always clears both auth
 * cookies, and returns 200.
 *
 * Requirements: 2.3
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const refreshToken = request.cookies.get('pv_refresh')?.value

  // Fire-and-forget: call REST API logout but ignore the result entirely.
  // We always clear cookies regardless of whether this succeeds or fails.
  if (refreshToken) {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      })
    } catch {
      // Intentionally ignored — logout must always succeed from the client's perspective
    }
  }

  const response = NextResponse.json({ success: true }, { status: 200 })
  clearAuthCookies(response)

  return response
}
