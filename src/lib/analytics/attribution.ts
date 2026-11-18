/**
 * Where a visitor came from: campaign tags (utm_*), ad click ids and the
 * referring site, kept as a first touch (90 days) and a last touch (30 days)
 * and sent with a booking, enquiry or food order. The API turns these into
 * channel estimates for the admin Analytics page.
 *
 * Consent: nothing is stored until the visitor allows analytics. The landing
 * touch is held in memory for the current page only, so if they accept on
 * this visit their arrival is still counted; if they never accept, it is
 * dropped with the page.
 */

import { readConsentCookie } from "./consent";
import { redactPath } from "./privacy";

export type Touch = {
  source: string;
  medium: string;
  campaign?: string;
  term?: string;
  content?: string;
  click_id_type?: ClickIdType;
  click_id?: string;
  landing_path: string;
  referrer_host?: string;
  /** ISO time of the visit. */
  at: string;
};

export const FIRST_TOUCH_COOKIE = "pv_ft";
export const LAST_TOUCH_COOKIE = "pv_lt";
const FIRST_TOUCH_DAYS = 90;
const LAST_TOUCH_DAYS = 30;

const CLICK_IDS = ["gclid", "gbraid", "wbraid", "fbclid", "msclkid", "ttclid"] as const;
type ClickIdType = (typeof CLICK_IDS)[number];

/** Where an ad click id alone says the visit came from. */
const CLICK_SOURCE: Record<ClickIdType, { source: string; medium: string }> = {
  gclid: { source: "google", medium: "cpc" },
  gbraid: { source: "google", medium: "cpc" },
  wbraid: { source: "google", medium: "cpc" },
  msclkid: { source: "bing", medium: "cpc" },
  ttclid: { source: "tiktok", medium: "cpc" },
  // fbclid is added to organic Facebook and Instagram links too.
  fbclid: { source: "facebook", medium: "social" },
};

/** Payment pages send visitors back here; returning from them is not a new visit. */
const IGNORED_REFERRERS = [/(^|\.)flutterwave\.com$/, /(^|\.)paystack\.(com|co)$/];

const SEARCH = [/(^|\.)google\.[a-z.]+$/, /(^|\.)bing\.com$/, /(^|\.)yahoo\.com$/, /(^|\.)duckduckgo\.com$/, /(^|\.)yandex\.[a-z]+$/, /(^|\.)ecosia\.org$/];
const KNOWN_SOURCES: [RegExp, string, string][] = [
  [/(^|\.)google\.[a-z.]+$/, "google", "organic"],
  [/(^|\.)bing\.com$/, "bing", "organic"],
  [/(^|\.)yahoo\.com$/, "yahoo", "organic"],
  [/(^|\.)duckduckgo\.com$/, "duckduckgo", "organic"],
  [/(^|\.)facebook\.com$/, "facebook", "social"],
  [/(^|\.)instagram\.com$/, "instagram", "social"],
  [/^(t\.co|(.+\.)?twitter\.com|(.+\.)?x\.com)$/, "twitter", "social"],
  [/(^|\.)(linkedin\.com|lnkd\.in)$/, "linkedin", "social"],
  [/(^|\.)youtube\.com$/, "youtube", "social"],
  [/(^|\.)tiktok\.com$/, "tiktok", "social"],
  [/^(wa\.me|(.+\.)?whatsapp\.com)$/, "whatsapp", "referral"],
];

const cap = (value: string | null, max: number) => (value ? value.trim().slice(0, max) || undefined : undefined);

/**
 * The touch for one page load, worked out from the address and referrer.
 * `isNew` is false for a direct visit (or a return from the payment page),
 * which never replaces an earlier campaign as the last touch.
 */
export function touchFromLanding(href: string, referrer: string, now = new Date()): { touch: Touch; isNew: boolean } {
  const url = new URL(href);
  const params = url.searchParams;
  const base = { landing_path: redactPath(url.pathname), at: now.toISOString() };

  let referrerHost: string | undefined;
  try {
    const host = referrer ? new URL(referrer).hostname.toLowerCase().replace(/^www\./, "") : "";
    const own = url.hostname.toLowerCase().replace(/^www\./, "");
    if (host && host !== own && !IGNORED_REFERRERS.some((re) => re.test(host))) referrerHost = host;
  } catch {
    referrerHost = undefined;
  }

  const clickType = CLICK_IDS.find((id) => params.get(id));
  const click = clickType ? { click_id_type: clickType, click_id: cap(params.get(clickType), 255) } : {};

  const utmSource = cap(params.get("utm_source"), 100);
  const utmMedium = cap(params.get("utm_medium"), 100);
  const utmCampaign = cap(params.get("utm_campaign"), 150);
  if (utmSource || utmMedium || utmCampaign) {
    const fallback = clickType ? CLICK_SOURCE[clickType] : referrerHost ? fromReferrer(referrerHost) : null;
    return {
      isNew: true,
      touch: {
        ...base,
        ...click,
        source: (utmSource ?? fallback?.source ?? "(not set)").toLowerCase(),
        medium: (utmMedium ?? fallback?.medium ?? "(not set)").toLowerCase(),
        campaign: utmCampaign,
        term: cap(params.get("utm_term"), 150),
        content: cap(params.get("utm_content"), 150),
        referrer_host: referrerHost,
      },
    };
  }
  if (clickType) {
    return { isNew: true, touch: { ...base, ...click, ...CLICK_SOURCE[clickType], referrer_host: referrerHost } };
  }
  if (referrerHost) {
    return { isNew: true, touch: { ...base, ...fromReferrer(referrerHost), referrer_host: referrerHost } };
  }
  return { isNew: false, touch: { ...base, source: "(direct)", medium: "(none)" } };
}

function fromReferrer(host: string): { source: string; medium: string } {
  for (const [re, source, medium] of KNOWN_SOURCES) {
    if (re.test(host)) return { source, medium };
  }
  return { source: host, medium: SEARCH.some((re) => re.test(host)) ? "organic" : "referral" };
}

// ---------------------------------------------------------------------------
// Storage (only with analytics consent)
// ---------------------------------------------------------------------------

function readCookie(name: string): Touch | null {
  const entry = document.cookie.split("; ").find((part) => part.startsWith(`${name}=`));
  if (!entry) return null;
  try {
    const value = JSON.parse(decodeURIComponent(entry.slice(name.length + 1))) as Touch;
    return value && typeof value.source === "string" ? value : null;
  } catch {
    return null;
  }
}

function writeCookie(name: string, touch: Touch, days: number) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(JSON.stringify(touch))}; Path=/; Max-Age=${days * 86_400}; SameSite=Lax${secure}`;
}

/** This page load's touch, held in memory until the visitor allows analytics. */
let landing: { touch: Touch; isNew: boolean } | null = null;
let landingRecorded = false;

/** Call once when the site first loads in a tab. */
export function recordLanding() {
  if (landingRecorded || typeof window === "undefined") return;
  landingRecorded = true;
  try {
    landing = touchFromLanding(window.location.href, document.referrer);
  } catch {
    landing = null;
  }
  persistAttribution();
}

/** Writes the touches to cookies if analytics is allowed. Safe to call often. */
export function persistAttribution() {
  if (typeof window === "undefined" || !landing) return;
  if (readConsentCookie()?.analytics !== true) return;
  if (!readCookie(FIRST_TOUCH_COOKIE)) writeCookie(FIRST_TOUCH_COOKIE, landing.touch, FIRST_TOUCH_DAYS);
  if (landing.isNew || !readCookie(LAST_TOUCH_COOKIE)) writeCookie(LAST_TOUCH_COOKIE, landing.touch, LAST_TOUCH_DAYS);
  landing = null; // stored; later pages in this tab are not new arrivals
}

/** The touches to send with a booking or lead, or nothing without consent. */
export function currentTouches(): { first_touch?: Touch; last_touch?: Touch } {
  if (typeof window === "undefined" || readConsentCookie()?.analytics !== true) return {};
  persistAttribution();
  const first = readCookie(FIRST_TOUCH_COOKIE) ?? undefined;
  const last = readCookie(LAST_TOUCH_COOKIE) ?? first;
  return { ...(first ? { first_touch: first } : {}), ...(last ? { last_touch: last } : {}) };
}
