/**
 * Shared types for the ticket booking funnel.
 * Mirrors the funnel state machine defined in design Section 10.
 */

export type FunnelStep = 1 | 2 | 3;

/** A per-product ticket selection with resolved unit prices. */
export interface TicketSelection {
  productId: string;
  name: string;
  adultQty: number;
  childQty: number;
  adultPrice: number;
  childPrice: number;
}

/** Guest contact details captured on the checkout step. */
export interface GuestDetails {
  fullName: string;
  whatsapp: string;
  email?: string;
}

export interface FunnelState {
  step: FunnelStep;
  visitDate: string | null; // YYYY-MM-DD
  selections: TicketSelection[];
  guestDetails: GuestDetails | null;
  bookingCode: string | null;
  isSubmitting: boolean;
  error: string | null;
}
