'use server';

import { redirect } from 'next/navigation';
import type { BookingLine, CreateBookingRequest } from '@park-vega/api-types';
import { checkoutApi } from '../../lib/services';
import { ApiError } from '../../lib/api-error';
import { normalizeNgPhone } from '../../lib/phone';

const SITE_URL = process.env.SITE_URL ?? 'http://localhost:3001';

export interface CheckoutState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

/**
 * Guest checkout (a signed-in visitor's booking is linked to them because
 * the token is sent when present):
 *
 * 1. POST /bookings creates a "reserved" booking, priced by the server.
 *    It expires after 15 minutes if payment isn't started, so go straight on.
 * 2. POST /bookings/:id/payment/initiate returns a Flutterwave checkout link.
 *    `redirect_url` must be on the API's FRONTEND_ORIGINS.
 * 3. Redirect the browser to Flutterwave. Payment is confirmed by the
 *    provider's webhook, not by the redirect, so /booking/<id> polls.
 *
 * Form fields: visit_date, full_name, phone, email, and per product
 * `items[<n>][ticket_product_id|adults|children]`.
 */
export async function checkoutAction(
  _prev: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  const phone = normalizeNgPhone(String(formData.get('phone') ?? ''));
  if (!phone) {
    const message = 'Enter a Nigerian mobile number, e.g. 0802 444 0445';
    return { error: message, fieldErrors: { phone: message } };
  }

  const email = String(formData.get('email') ?? '').trim();
  const body: CreateBookingRequest = {
    visit_date: String(formData.get('visit_date') ?? ''),
    full_name: String(formData.get('full_name') ?? '').trim(),
    phone,
    whatsapp: phone,
    ...(email ? { email } : {}),
    items: readLines(formData),
  };

  let paymentUrl: string;
  try {
    const booking = await checkoutApi.createBooking(body);
    const payment = await checkoutApi.initiatePayment(
      booking.id,
      `${SITE_URL}/booking/${booking.id}`,
    );
    paymentUrl = payment.authorization_url;
  } catch (err) {
    if (err instanceof ApiError) {
      return { error: err.message, fieldErrors: err.fieldErrorMap };
    }
    return { error: "We couldn't start your booking. Please try again." };
  }

  // redirect() throws, so it must sit outside the try block.
  redirect(paymentUrl);
}

function readLines(formData: FormData): BookingLine[] {
  const lines = new Map<string, Partial<Record<keyof BookingLine, string>>>();
  for (const [key, value] of formData.entries()) {
    const match = /^items\[(\d+)\]\[(ticket_product_id|adults|children)\]$/.exec(key);
    if (!match) continue;
    const line = lines.get(match[1]) ?? {};
    line[match[2] as keyof BookingLine] = String(value);
    lines.set(match[1], line);
  }
  return [...lines.values()]
    .map((line) => ({
      ticket_product_id: line.ticket_product_id ?? '',
      adults: Number(line.adults ?? 0) || 0,
      children: Number(line.children ?? 0) || 0,
    }))
    .filter((line) => line.ticket_product_id && line.adults + line.children > 0);
}
