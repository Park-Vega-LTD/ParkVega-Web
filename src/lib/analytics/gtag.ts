/**
 * Thin, typed access to the dataLayer that Google Tag Manager reads.
 * The dataLayer and `gtag` shim are created by the inline consent script in
 * the root layout before anything else runs; these helpers also create them
 * if missing so calls never throw.
 */

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    clarity?: ((...args: unknown[]) => void) & { q?: unknown[] };
  }
}

function ensureDataLayer(): unknown[] {
  window.dataLayer = window.dataLayer || [];
  return window.dataLayer;
}

/** `gtag(...)` as Google documents it: pushes the `arguments` object itself. */
export function gtag(...args: unknown[]) {
  if (typeof window === "undefined") return;
  if (window.gtag) {
    window.gtag(...args);
    return;
  }
  // Same as the shim: GTM only treats Arguments objects as gtag commands.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const shim = function (..._: unknown[]) {
    // eslint-disable-next-line prefer-rest-params
    ensureDataLayer().push(arguments);
  };
  shim(...args);
}

/** A plain dataLayer event for GTM triggers, e.g. `{ event: "pv_page_view", ... }`. */
export function pushDataLayer(entry: { event: string } & Record<string, unknown>) {
  if (typeof window === "undefined") return;
  ensureDataLayer().push(entry);
}
