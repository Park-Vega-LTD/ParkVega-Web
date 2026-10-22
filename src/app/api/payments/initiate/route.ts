import { NextRequest, NextResponse } from 'next/server'
import { cookies, headers } from 'next/headers'
import { buildRedirectUrl } from '@/lib/flutterwave'

interface InitiatePaymentResponseData {
  authorization_url: string
  payment_id: string
}

interface RestEnvelope<T> {
  data: T
}

/**
 * POST /api/payments/initiate
 *
 * Reads { bookingId } from the request body, forwards the pv_access cookie as
 * a Bearer token when the visitor is signed in (guests check out without an
 * account, so it is optional), calls POST /bookings/:bookingId/payment/initiate on the
 * REST API (including a redirect_url so Flutterwave returns the user to the
 * public booking confirmation page), and returns { authorization_url, payment_id } on
 * success.
 *
 * On REST API error the handler forwards the upstream status code and the
 * user-readable message from the REST API response body.
 *
 * Requirements: 7.2, 7.3
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  // --- 1. Parse request body ---
  let body: { bookingId?: string }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: 'Invalid request body.' }, { status: 400 })
  }

  const { bookingId } = body

  if (!bookingId) {
    return NextResponse.json({ message: 'bookingId is required.' }, { status: 400 })
  }

  // --- 2. Read the (optional) access token from the httpOnly cookie ---
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('pv_access')?.value

  // --- 3. Build the redirect URL using the request origin ---
  //     headers() gives us access to the incoming request headers including
  //     the `origin` header (set by browsers on same-origin/CORS requests).
  //     We fall back to NEXT_PUBLIC_API_URL's origin or an empty string if
  //     neither is available — in practice the browser always sends `origin`.
  const headerStore = await headers()
  const origin =
    headerStore.get('origin') ??
    (process.env.NEXT_PUBLIC_API_URL
      ? new URL(process.env.NEXT_PUBLIC_API_URL).origin
      : '')

  const redirectUrl = buildRedirectUrl(origin, bookingId)

  // --- 4. Call REST API payment initiation endpoint ---
  try {
    const apiRes = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/bookings/${bookingId}/payment/initiate`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ redirect_url: redirectUrl }),
      }
    )

    // --- 5. Forward REST API errors to the client ---
    if (!apiRes.ok) {
      const errorBody = await apiRes.json().catch(() => ({}))
      const message: string =
        errorBody.message ?? `Payment initiation failed (${apiRes.status}).`
      return NextResponse.json({ message }, { status: apiRes.status })
    }

    // --- 6. Return { authorization_url, payment_id } on success ---
    const envelope: RestEnvelope<InitiatePaymentResponseData> = await apiRes.json()
    const { authorization_url, payment_id } = envelope.data

    return NextResponse.json({ authorization_url, payment_id }, { status: 200 })
  } catch {
    return NextResponse.json(
      { message: 'Payment initiation failed. Please try again.' },
      { status: 500 }
    )
  }
}
