import 'server-only'

/**
 * Verifies the Flutterwave webhook signature header.
 *
 * Flutterwave sends a `verif-hash` header with every webhook event. This
 * value must equal the `FLUTTERWAVE_WEBHOOK_HASH` environment variable that
 * was configured on the Flutterwave dashboard.
 *
 * @param verifHash - The value of the `verif-hash` request header
 * @returns `true` if the hash matches the configured secret, `false` otherwise
 */
export function verifyWebhookHash(verifHash: string | null): boolean {
  const secret = process.env.FLUTTERWAVE_WEBHOOK_HASH
  if (!secret || !verifHash) return false
  return verifHash === secret
}

/**
 * Builds the redirect URL to send to Flutterwave during payment initiation.
 * After the user completes (or cancels) payment, Flutterwave redirects them
 * back to this URL — the public booking confirmation page, which works for
 * guests without an account.
 *
 * @param origin  - The scheme + host of the Next.js app (e.g. "https://parkvega.com")
 * @param bookingId - The booking ID used to construct the ticket path
 * @returns Full absolute URL, e.g. "https://parkvega.com/booking/PV-0123456789"
 */
export function buildRedirectUrl(origin: string, bookingId: string): string {
  return `${origin}/booking/${bookingId}`
}
