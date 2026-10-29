import { NextRequest, NextResponse } from 'next/server'
import { API_URL } from '@/lib/api-url'
import { verifyWebhookHash } from '@/lib/flutterwave'

/**
 * POST /api/payments/webhook
 *
 * Receives Flutterwave webhook events. No auth cookie is required or read.
 *
 * 1. Reads the raw request body as text.
 * 2. Verifies the `verif-hash` header against the `FLUTTERWAVE_WEBHOOK_HASH`
 *    environment variable using the shared `verifyWebhookHash` helper.
 * 3. On signature mismatch (or missing header): returns 401 immediately and
 *    does NOT forward the payload.
 * 4. On match: forwards the raw body as-is to POST /payments/webhook on the
 *    REST API with Content-Type: application/json.
 * 5. Returns 200 if the REST API responds with a 2xx status; 500 otherwise.
 *
 * Requirements: 7.6, 7.7, 7.8, 7.9
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  // --- 1. Read raw body as text ---
  const rawBody = await request.text()

  // --- 2. Verify the signature header ---
  const verifHash = request.headers.get('verif-hash')

  if (!verifyWebhookHash(verifHash)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  // --- 3. Forward raw payload to the REST API webhook endpoint ---
  try {
    const apiRes = await fetch(`${API_URL}/payments/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: rawBody,
    })

    // --- 4. Return 200 on REST 2xx, 500 on REST error ---
    if (apiRes.ok) {
      return new NextResponse(null, { status: 200 })
    }

    return new NextResponse(null, { status: 500 })
  } catch {
    return new NextResponse(null, { status: 500 })
  }
}
