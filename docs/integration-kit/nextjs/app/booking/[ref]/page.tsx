import { notFound } from 'next/navigation';
import { checkoutApi } from '../../../lib/services';
import { ApiError } from '../../../lib/api-error';
import { RefreshWhilePending } from './refresh-while-pending';

const naira = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 0,
});

/**
 * /booking/<id or code>. Two ways in:
 *  - back from Flutterwave (checkout passes /booking/<id> as redirect_url)
 *  - the link in the WhatsApp confirmation (${FRONTEND_URL}/booking/<code>)
 *
 * The redirect proves nothing: payment is confirmed by the provider's
 * webhook and tickets are issued by a background job. So this page reads
 * the booking and, while it is pending, re-renders every few seconds.
 * Guests see masked contact details; that's expected.
 */
export default async function BookingPage({
  params,
}: {
  params: Promise<{ ref: string }>;
}) {
  const { ref } = await params;

  let booking;
  try {
    booking = await checkoutApi.getBooking(ref);
  } catch (err) {
    if (err instanceof ApiError && err.isNotFound) notFound();
    throw err;
  }

  if (booking.status === 'reserved' || booking.status === 'pending_payment') {
    return (
      <main>
        <h1>Confirming your payment…</h1>
        <p>
          This usually takes a few seconds. If it takes longer, we&apos;ll
          send your tickets on WhatsApp as soon as payment clears.
        </p>
        <p>Booking reference: {booking.code}</p>
        <RefreshWhilePending />
      </main>
    );
  }

  if (booking.status === 'cancelled') {
    return (
      <main>
        <h1>This booking is no longer active</h1>
        <p>It expired before payment, or was cancelled or refunded.</p>
        <a href="/tickets">Start a new booking</a>
      </main>
    );
  }

  // paid or checked_in. Tickets can lag a few seconds behind "paid".
  const tickets = await checkoutApi.getTickets(booking.id);

  return (
    <main>
      <h1>You&apos;re booked!</h1>
      <p>
        {booking.ticket_name} · {booking.visit_date} · {booking.adults} adults,{' '}
        {booking.children} children
      </p>
      <p>
        Total paid: {naira.format(booking.total)}
        {booking.discount > 0 && <> (you saved {naira.format(booking.discount)})</>}
      </p>
      <p>Reference: {booking.code}</p>

      <h2>Your tickets</h2>
      {tickets.length === 0 ? (
        <>
          <p>Your tickets are being issued…</p>
          <RefreshWhilePending />
        </>
      ) : (
        <ul>
          {tickets.map((t) => (
            <li key={t.id}>
              {/* Render t.ticket_code as a QR code (e.g. with `qrcode.react`);
                  the gate scanner reads it. */}
              {t.visitor_category}: {t.ticket_code} ({t.status})
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
