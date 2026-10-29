import { NextRequest, NextResponse } from 'next/server'
import { apiHeaders } from '@/lib/forwarded'
import { API_URL } from '@/lib/api-url'
import type { User } from '@/types/api'

interface RegisterResponseData {
  user: User
}

interface RestEnvelope<T> {
  data: T
}

/**
 * POST /api/auth/register
 *
 * Reads { first_name, last_name, email, password } from the request body,
 * calls the REST API POST /auth/register, and returns the created user
 * profile. Does NOT set any auth cookies — the client must call login
 * separately after registration.
 *
 * Requirements: 2.2
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: {
    first_name?: string
    last_name?: string
    email?: string
    phone_number?: string
    password?: string
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: 'Invalid request body.' }, { status: 400 })
  }

  const { first_name, last_name, email, phone_number, password } = body

  try {
    const apiRes = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...apiHeaders(request.headers) },
      body: JSON.stringify({ first_name, last_name, email, phone_number, password }),
    })

    if (apiRes.status === 409) {
      // The email or the phone number is already registered; prefer the API's wording.
      const conflict = await apiRes.json().catch(() => ({}))
      return NextResponse.json(
        { message: conflict.message ?? 'An account with this email or phone number already exists.' },
        { status: 409 }
      )
    }

    if (apiRes.status === 201 || apiRes.ok) {
      const envelope: RestEnvelope<RegisterResponseData> = await apiRes.json()
      const { user } = envelope.data
      return NextResponse.json({ user }, { status: 201 })
    }

    return NextResponse.json({ message: 'Registration failed.' }, { status: 500 })
  } catch {
    return NextResponse.json({ message: 'Registration failed.' }, { status: 500 })
  }
}
