/**
 * Park Vega's tourism event taxonomy: every browser event the site sends,
 * typed in one place. GA4 recommended names are used where they fit so GA4's
 * ecommerce and funnel reports work without extra setup.
 *
 * Rules:
 * - Nothing that identifies a person: no names, phone numbers, emails or
 *   booking codes. Ticket products, dates and counts only.
 * - Nothing is pushed unless the visitor allowed analytics or advertising.
 * - `purchase` and `refund` are NOT sent from the browser. The API sends them
 *   to GA4 once the payment provider has confirmed the money (see
 *   park-vega-services ConversionEventsService), so GA4 revenue matches ours.
 *
 * GTM picks these up as custom events (docs/analytics-setup.md).
 */

import { readConsentCookie } from "./consent";
import { pushDataLayer } from "./gtag";

export const CURRENCY = "NGN";

/** A ticket line as GA4 ecommerce expects it. */
export type AnalyticsItem = {
  item_id: string;
  item_name: string;
  item_category: "Ticket" | "Event" | "Food";
  /** adult | child */
  item_variant?: string;
  price: number;
  quantity: number;
};

export type LeadType = "birthday" | "school" | "corporate";
export type ContactPlacement = "header" | "footer" | "floating" | "content";

/** Every event the site may send, with its parameters. */
export type AnalyticsEvent =
  // Booking funnel
  | {
      name: "view_item_list";
      item_list_id: "tickets";
      item_list_name: string;
      visit_date: string;
      /** Prices load per row, so the list carries products only. */
      items: Array<Pick<AnalyticsItem, "item_id" | "item_name" | "item_category"> & { index: number }>;
    }
  | { name: "select_visit_date"; visit_date: string; lead_time_days: number; visit_weekday: string }
  | { name: "add_to_cart"; visit_date: string; value: number; items: AnalyticsItem[]; ticket_count: number }
  | { name: "begin_checkout"; visit_date: string; value: number; items: AnalyticsItem[]; ticket_count: number }
  | {
      name: "add_payment_info";
      visit_date: string;
      value: number;
      items: AnalyticsItem[];
      payment_type: "online_gateway";
    }
  | { name: "checkout_error"; step: "create_booking" | "start_payment" }
  /** The visitor came back from the payment page. Not a purchase: the API reports that. */
  | { name: "payment_return_view"; payment_status: "paid" | "pending" | "failed" | "other" }
  // Leads
  | { name: "generate_lead"; lead_type: LeadType; method: "form" | "whatsapp_fallback" }
  // Contact and directions
  | { name: "contact_whatsapp"; link_placement: ContactPlacement }
  | { name: "contact_phone"; link_placement: ContactPlacement }
  | { name: "contact_email"; link_placement: ContactPlacement }
  | { name: "get_directions"; link_placement: ContactPlacement; origin_city?: string }
  // Food
  | { name: "food_order_placed"; value: number; item_count: number; payment_mode: "counter" | "online" };

export type AnalyticsEventName = AnalyticsEvent["name"];

/** GA4 ecommerce events: their parameters travel in the `ecommerce` object. */
const ECOMMERCE_EVENTS = new Set<AnalyticsEventName>([
  "view_item_list",
  "add_to_cart",
  "begin_checkout",
  "add_payment_info",
]);

export function track(event: AnalyticsEvent) {
  if (typeof window === "undefined") return;
  const consent = readConsentCookie();
  if (!consent?.analytics && !consent?.marketing) return;

  const { name, ...params } = event;
  if (ECOMMERCE_EVENTS.has(name)) {
    const { items, value, ...rest } = params as {
      items: unknown[];
      value?: number;
    } & Record<string, unknown>;
    // GTM keeps ecommerce data between pushes unless it is cleared first.
    pushDataLayer({ event: "pv_clear_ecommerce", ecommerce: null });
    pushDataLayer({
      event: name,
      ecommerce: { currency: CURRENCY, ...(value !== undefined ? { value } : {}), items },
      pv: rest,
    });
    return;
  }
  pushDataLayer({ event: name, pv: params });
}

// ---------------------------------------------------------------------------
// Helpers for building parameters
// ---------------------------------------------------------------------------

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** Today's date in Lagos (UTC+1, no daylight saving) as YYYY-MM-DD. */
export function todayInLagos(now = new Date()): string {
  return new Date(now.getTime() + 60 * 60 * 1000).toISOString().slice(0, 10);
}

/** Whole days from today (Lagos) to a YYYY-MM-DD visit date. */
export function leadTimeDays(visitDate: string, now = new Date()): number {
  const diff = Date.parse(`${visitDate}T00:00:00Z`) - Date.parse(`${todayInLagos(now)}T00:00:00Z`);
  return Math.round(diff / 86_400_000);
}

export function weekdayOf(visitDate: string): string {
  return WEEKDAYS[new Date(`${visitDate}T00:00:00Z`).getUTCDay()] ?? "";
}

/** Ticket selections from the booking funnel as GA4 items (one per product and category). */
export function ticketItems(
  selections: ReadonlyArray<{
    productId: string;
    name: string;
    adultQty: number;
    childQty: number;
    infantQty: number;
    adultPrice: number;
    childPrice: number;
    infantPrice: number;
  }>,
): AnalyticsItem[] {
  return selections.flatMap((sel) => {
    const lines: AnalyticsItem[] = [];
    if (sel.adultQty > 0) {
      lines.push({
        item_id: sel.productId,
        item_name: sel.name,
        item_category: "Ticket",
        item_variant: "standard",
        price: sel.adultPrice,
        quantity: sel.adultQty,
      });
    }
    if (sel.childQty > 0) {
      lines.push({
        item_id: sel.productId,
        item_name: sel.name,
        item_category: "Ticket",
        item_variant: "junior",
        price: sel.childPrice,
        quantity: sel.childQty,
      });
    }
    if (sel.infantQty > 0) {
      lines.push({
        item_id: sel.productId,
        item_name: sel.name,
        item_category: "Ticket",
        item_variant: "toddler",
        price: sel.infantPrice,
        quantity: sel.infantQty,
      });
    }
    return lines;
  });
}

export function itemsValue(items: ReadonlyArray<AnalyticsItem>): number {
  return Math.round(items.reduce((sum, item) => sum + item.price * item.quantity, 0) * 100) / 100;
}

export function itemsCount(items: ReadonlyArray<AnalyticsItem>): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}
