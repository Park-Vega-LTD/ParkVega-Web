/**
 * Where to send someone after they log in or sign up. Only same-site paths
 * are allowed: "//evil.com" or "/\evil.com" would otherwise redirect off-site.
 */
export function safeNextPath(next: string | null | undefined, fallback = "/my-bookings") {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}

/** Query string for the login/sign-up pages that returns the visitor to `next`. */
export function nextQuery(next: string) {
  return `?next=${encodeURIComponent(next)}`;
}
