import { NextRequest, NextResponse } from 'next/server'
import { apiHeaders } from '@/lib/forwarded'
import { API_URL } from '@/lib/api-url'
import { setAuthCookies } from '@/lib/auth'
import type { User } from '@/types/api'

interface LoginResponseData {
  user: User
  access_token: string
  refresh_token: string
  expires_in: number
}

interface RestEnvelope<T> {
  data: T
}

/**
 * POST /api/auth/login
 *
 * Reads { email, password } from the request body, calls the REST API
 * POST /auth/login, sets httpOnly auth cookies on success, and returns
 * the user profile.
 *
 * Requirements: 2.1
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: { email?: string; password?: string }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: 'Invalid request body.' }, { status: 400 })
  }

  const { email, password } = body

  try {
    const apiRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...apiHeaders(request.headers) },
      body: JSON.stringify({ email, password }),
    })

    if (apiRes.status === 401) {
      return NextResponse.json(
        { message: 'Incorrect email or password.' },
        { status: 401 }
      )
    }

    if (!apiRes.ok) {
      return NextResponse.json({ message: 'Something went wrong.' }, { status: 500 })
    }

    const envelope: RestEnvelope<LoginResponseData> = await apiRes.json()
    const { user, access_token, refresh_token, expires_in } = envelope.data

    const response = NextResponse.json({ user }, { status: 200 })
    setAuthCookies(response, access_token, refresh_token, expires_in)

    return response
  } catch {
    return NextResponse.json({ message: 'Something went wrong.' }, { status: 500 })
  }
}
