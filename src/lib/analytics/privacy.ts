/**
 * What third-party analytics may see of a URL.
 *
 * A booking code in `/booking/<code>` is the only key a guest needs to open
 * their booking and tickets, so it is a secret: it must never reach GA4,
 * Clarity or any ad platform. Query strings can carry payment details too
 * (the gateway appends `tx_ref`, `transaction_id` and `status` when it sends
 * the payer back), so only campaign parameters are kept.
 *
 * Plain data plus pure functions so the inline consent script in the root
 * layout can reuse the same rules (see consent-default-script.tsx).
 */

/** Path patterns whose dynamic segment is replaced before any page view is sent. */
export const REDACTED_PATHS: ReadonlyArray<{ pattern: string; replacement: string }> = [
  { pattern: "^/booking/[^/?#]+", replacement: "/booking/[code]" },
  { pattern: "^/ticket/[^/?#]+", replacement: "/ticket/[code]" },
];

/** Query parameters that may be passed on; everything else is dropped. */
export const ALLOWED_QUERY_PARAMS: readonly string[] = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "utm_id",
  "gclid",
  "gbraid",
  "wbraid",
  "fbclid",
  "msclkid",
  "ttclid",
];

/**
 * Areas where Clarity never records: personal booking and ticket pages, the
 * signed-in account area, and sign-in forms. URLs and screens here can show a
 * booking code or personal details.
 */
export const PRIVATE_PATH_PREFIXES: readonly string[] = [
  "/booking",
  "/ticket",
  "/my-bookings",
  "/my-day",
  "/account",
  "/login",
  "/register",
];

export function redactPath(pathname: string): string {
  for (const { pattern, replacement } of REDACTED_PATHS) {
    const re = new RegExp(pattern);
    if (re.test(pathname)) return pathname.replace(re, replacement);
  }
  return pathname;
}

export function redactSearch(search: string): string {
  const input = new URLSearchParams(search);
  const output = new URLSearchParams();
  for (const key of ALLOWED_QUERY_PARAMS) {
    const value = input.get(key);
    if (value) output.set(key, value.slice(0, 200));
  }
  const text = output.toString();
  return text ? `?${text}` : "";
}

/** A full URL with the path redacted, the query filtered and the hash removed. */
export function redactUrl(href: string): string {
  try {
    const url = new URL(href);
    return `${url.origin}${redactPath(url.pathname)}${redactSearch(url.search)}`;
  } catch {
    return "";
  }
}

/**
 * The referrer as analytics may see it: our own pages are redacted like any
 * other URL; other sites are cut to their origin.
 */
export function redactReferrer(referrer: string, ownOrigin: string): string {
  if (!referrer) return "";
  try {
    const url = new URL(referrer);
    return url.origin === ownOrigin ? redactUrl(referrer) : `${url.origin}/`;
  } catch {
    return "";
  }
}

export function isPrivatePath(pathname: string): boolean {
  return PRIVATE_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
