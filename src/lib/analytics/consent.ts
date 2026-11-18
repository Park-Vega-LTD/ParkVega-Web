/**
 * Visitor consent for optional cookies, under the Nigeria Data Protection Act
 * 2023 and the NDPC's General Application and Implementation Directive.
 *
 * Nothing optional runs until the visitor chooses: no Google Tag Manager, no
 * GA4, no Clarity, no ad pixels. The choice lives in a first-party cookie so
 * the inline script in the root layout can apply it before any tag loads.
 *
 * Cookie `pv_consent` = `<version>|<analytics 0/1>|<marketing 0/1>|<unix seconds>`.
 * Raising NEXT_PUBLIC_CONSENT_VERSION (for example after the cookie notice
 * changes) makes every visitor choose again.
 */

export const CONSENT_COOKIE = "pv_consent";

/** Twelve months, after which the visitor is asked again. */
export const CONSENT_MAX_AGE_SECONDS = 365 * 24 * 60 * 60;

export const CONSENT_VERSION = process.env.NEXT_PUBLIC_CONSENT_VERSION || "1";

export type ConsentChoice = {
  /** GA4 and Clarity: visits, pages and how the site is used. */
  analytics: boolean;
  /** Ad platforms such as the Meta Pixel: measuring and improving adverts. */
  marketing: boolean;
};

export type StoredConsent = ConsentChoice & { version: string; decidedAt: number };

/** Cookies each category sets on our domain, removed when consent is withdrawn. */
export const CATEGORY_COOKIES: Record<keyof ConsentChoice, readonly RegExp[]> = {
  analytics: [/^_ga$/, /^_ga_/, /^_gid$/, /^_gat/, /^_clck$/, /^_clsk$/, /^pv_ft$/, /^pv_lt$/],
  marketing: [/^_fbp$/, /^_fbc$/, /^_gcl_/],
};

export function parseConsent(raw: string | undefined | null): StoredConsent | null {
  if (!raw) return null;
  const [version, analytics, marketing, decidedAt] = decodeURIComponent(raw).split("|");
  if (version !== CONSENT_VERSION) return null;
  if (!["0", "1"].includes(analytics) || !["0", "1"].includes(marketing)) return null;
  return {
    version,
    analytics: analytics === "1",
    marketing: marketing === "1",
    decidedAt: Number(decidedAt) || 0,
  };
}

export function serializeConsent(choice: ConsentChoice, now = Date.now()): string {
  return [
    CONSENT_VERSION,
    choice.analytics ? "1" : "0",
    choice.marketing ? "1" : "0",
    Math.floor(now / 1000),
  ].join("|");
}

export function readConsentCookie(): StoredConsent | null {
  if (typeof document === "undefined") return null;
  const entry = document.cookie
    .split("; ")
    .find((part) => part.startsWith(`${CONSENT_COOKIE}=`));
  return parseConsent(entry?.slice(CONSENT_COOKIE.length + 1));
}

export function writeConsentCookie(choice: ConsentChoice) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${CONSENT_COOKIE}=${encodeURIComponent(serializeConsent(choice))}; Path=/; Max-Age=${CONSENT_MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
}

/** Google Consent Mode v2 signals for a choice. */
export function consentModeState(choice: ConsentChoice) {
  const analytics = choice.analytics ? "granted" : "denied";
  const marketing = choice.marketing ? "granted" : "denied";
  return {
    analytics_storage: analytics,
    ad_storage: marketing,
    ad_user_data: marketing,
    ad_personalization: marketing,
  } as const;
}

/**
 * Deletes the cookies of every category the visitor no longer allows, on this
 * host and on each parent domain (GA sets them on the registrable domain).
 */
export function clearWithdrawnCookies(previous: ConsentChoice, next: ConsentChoice) {
  const withdrawn = (Object.keys(CATEGORY_COOKIES) as (keyof ConsentChoice)[]).filter(
    (category) => previous[category] && !next[category],
  );
  if (withdrawn.length === 0) return;

  const patterns = withdrawn.flatMap((category) => CATEGORY_COOKIES[category]);
  const names = document.cookie
    .split("; ")
    .map((part) => part.split("=")[0])
    .filter((name) => patterns.some((re) => re.test(name)));

  const labels = window.location.hostname.split(".");
  const domains = [""];
  for (let i = 0; i < labels.length - 1; i++) domains.push(`; Domain=.${labels.slice(i).join(".")}`);

  for (const name of names) {
    for (const domain of domains) {
      document.cookie = `${name}=; Path=/; Max-Age=0${domain}`;
    }
  }
}
