/**
 * The analytics context sent to the API with a new booking, so the API can
 * report the verified purchase to GA4 against this visitor's session.
 * Contains no personal details; GA ids are only included with analytics
 * consent, and the API drops them otherwise too.
 */

import { currentTouches, type Touch } from "./attribution";
import { readConsentCookie } from "./consent";

export type BookingTracking = {
  consent_analytics: boolean;
  consent_marketing: boolean;
  ga_client_id?: string;
  ga_session_id?: string;
  device_category?: "mobile" | "tablet" | "desktop";
  first_touch?: Touch;
  last_touch?: Touch;
};

const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID ?? "";

function cookie(name: string): string | undefined {
  const entry = document.cookie.split("; ").find((part) => part.startsWith(`${name}=`));
  return entry ? decodeURIComponent(entry.slice(name.length + 1)) : undefined;
}

/** `_ga` = GA1.1.<random>.<timestamp>; the client id is the last two parts. */
export function parseGaClientId(value: string | undefined): string | undefined {
  const match = value?.match(/^GA\d\.\d+\.(\d+\.\d+)$/);
  return match?.[1];
}

/**
 * `_ga_<stream>` holds the session id: GS1.1.<session>.… (older format) or
 * GS2.1.s<session>$o…$g…$t… (current format).
 */
export function parseGaSessionId(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const gs2 = value.match(/^GS2\.\d+\.s(\d+)/);
  if (gs2) return gs2[1];
  const gs1 = value.match(/^GS1\.\d+\.(\d+)\./);
  return gs1?.[1];
}

function sessionCookie(): string | undefined {
  if (GA4_ID.startsWith("G-")) return cookie(`_ga_${GA4_ID.slice(2)}`);
  // Without the id configured, use the only GA4 session cookie if there is one.
  const entries = document.cookie.split("; ").filter((part) => part.startsWith("_ga_"));
  return entries.length === 1 ? decodeURIComponent(entries[0].split("=")[1] ?? "") : undefined;
}

function deviceCategory(): BookingTracking["device_category"] {
  const width = window.innerWidth;
  if (width < 768) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}

export function bookingTracking(): BookingTracking {
  const consent = readConsentCookie();
  const analytics = consent?.analytics === true;
  const tracking: BookingTracking = {
    consent_analytics: analytics,
    consent_marketing: consent?.marketing === true,
    device_category: deviceCategory(),
  };
  if (analytics) {
    const clientId = parseGaClientId(cookie("_ga"));
    const sessionId = parseGaSessionId(sessionCookie());
    if (clientId) tracking.ga_client_id = clientId;
    if (sessionId) tracking.ga_session_id = sessionId;
    Object.assign(tracking, currentTouches());
  }
  return tracking;
}
