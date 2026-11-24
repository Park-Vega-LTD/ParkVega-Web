/**
 * Shared types for the ticket booking funnel.
 * Mirrors the funnel state machine defined in design Section 10.
 */

export type FunnelStep = 1 | 2 | 3;

/** A per-product ticket selection with resolved unit prices. */
export interface TicketSelection {
  productId: string;
  name: string;
  /** Standard ticket (above 150 cm) quantity. */
  adultQty: number;
  /** Junior ticket (90 cm – 150 cm) quantity. */
  childQty: number;
  /** Toddler ticket (under 90 cm) quantity — always free. */
  infantQty: number;
  adultPrice: number;
  childPrice: number;
  infantPrice: number;
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
