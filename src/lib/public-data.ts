import { publicFetch } from "@/lib/api.server";
import { fallbackFaqs } from "@/lib/home-content";
import {
  EXTRA_OPEN_DATES,
  FALLBACK_TICKET_PRICE,
  OPEN_DAYS_LONG,
  OPEN_HOURS,
} from "@/lib/site";
import { ATTRACTION_FALLBACK_IMAGE, type Photo } from "@/lib/site-photos";
import type { Event, FAQ, PageImage, SiteSettings, TicketProduct } from "@/types/api";

/**
 * Cached public data shared by several pages. Identical `fetch` calls are
 * de-duplicated within a render, so pages and the FAQ block can each call
 * these helpers without extra API requests.
 */

export const publicFetchOpts = { next: { revalidate: 60 } } as const;

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

/** Lowest adult price across active products that is valid today. */
export function lowestAdultPrice(products: TicketProduct[], today = todayStr()): number | undefined {
  const prices = products
    .filter((product) => product.active)
    .flatMap((product) => product.pricing_tiers)
    .filter(
      (tier) =>
        tier.category === "ADULT" &&
        tier.valid_from <= today &&
        (!tier.valid_to || tier.valid_to >= today),
    )
    .map((tier) => tier.price)
    .filter((price) => price > 0);
  return prices.length > 0 ? Math.min(...prices) : undefined;
}

export async function getTicketProducts(): Promise<TicketProduct[]> {
  return publicFetch<TicketProduct[]>("/ticket-products", publicFetchOpts).catch(
    () => [] as TicketProduct[],
  );
}

export const DEFAULT_SETTINGS: SiteSettings = {
  ticket_price_from: null,
  opening_days: OPEN_DAYS_LONG,
  opening_hours: OPEN_HOURS,
  extra_open_dates: EXTRA_OPEN_DATES,
  hero_video_url: process.env.NEXT_PUBLIC_HERO_VIDEO_URL || null,
  hero_image_url: null,
  notice: null,
};

/**
 * Staff-managed homepage & visit settings, merged over the defaults so a
 * missing or partial response never blanks the site.
 */
export async function getSiteSettings(): Promise<SiteSettings> {
  const saved = await publicFetch<Partial<SiteSettings>>("/content/settings", publicFetchOpts).catch(
    () => ({}) as Partial<SiteSettings>,
  );
  return mergeSettings(saved);
}

/** Saved settings over the defaults; empty values fall back to the default. */
export function mergeSettings(saved: Partial<SiteSettings>): SiteSettings {
  const merged = { ...DEFAULT_SETTINGS };
  for (const [key, value] of Object.entries(saved) as [keyof SiteSettings, unknown][]) {
    if (value !== undefined && value !== null && value !== "") (merged as Record<string, unknown>)[key] = value;
  }
  return merged;
}

/** The "Tickets from" price: staff override, else the lowest adult price, else ₦15,000. */
export async function getFromPrice(): Promise<number> {
  const [settings, products] = await Promise.all([getSiteSettings(), getTicketProducts()]);
  return settings.ticket_price_from ?? lowestAdultPrice(products) ?? FALLBACK_TICKET_PRICE;
}

/**
 * Extra (Mon–Wed) open dates: the settings holiday list plus the session
 * dates of any published "Holiday opening" event, so marketing only has to
 * create the event for the booking calendar to open that day.
 */
export async function getExtraOpenDates(): Promise<string[]> {
  const [settings, events] = await Promise.all([
    getSiteSettings(),
    publicFetch<Event[]>("/events", publicFetchOpts).catch(() => [] as Event[]),
  ]);
  const holidayDates = events
    .filter((event) => event.status === "PUBLISHED" && event.category === "HOLIDAY_OPENING")
    .flatMap((event) => (event.sessions ?? []).map((session) => session.session_date.slice(0, 10)));
  return [...new Set([...settings.extra_open_dates, ...holidayDates])].sort();
}

/** Every photo staff chose for a page under Page images in the console. */
export async function getPageImages(pageKey: string): Promise<PageImage[]> {
  return publicFetch<PageImage[]>(
    `/content/page-images?page_key=${encodeURIComponent(pageKey)}`,
    publicFetchOpts,
  ).catch(() => [] as PageImage[]);
}

/**
 * A spot's photos: the slot's chosen photos (in position order) laid over
 * the built-in defaults one by one. A position staff left empty keeps its
 * default, and a chosen photo without alt text borrows the default's.
 */
export function spotPhotos(images: PageImage[], slot: string, defaults: Photo[]): Photo[] {
  const chosen = images
    .filter((image) => image.slot === slot)
    .sort((a, b) => a.position - b.position);
  return defaults.map((photo, index) => {
    const pick = chosen[index];
    return pick?.url ? { src: pick.url, alt: pick.alt_text || photo.alt } : photo;
  });
}

/** A single-photo spot: the chosen photo for `pageKey/slot`, else the fallback. */
export async function getSpotPhoto(pageKey: string, slot: string, fallback: Photo): Promise<Photo> {
  return spotPhotos(await getPageImages(pageKey), slot, [fallback])[0];
}

/** The photo shown for attractions without their own image (`site/attraction-fallback`). */
export async function getAttractionFallbackImage(): Promise<string> {
  const photo = await getSpotPhoto("site", "attraction-fallback", {
    src: ATTRACTION_FALLBACK_IMAGE,
    alt: "",
  });
  return photo.src;
}

/** Staff-managed FAQs, or the exact-phrasing fallback set when none exist. */
export async function getFaqs(): Promise<FAQ[]> {
  const [faqs, fromPrice] = await Promise.all([
    publicFetch<FAQ[]>("/content/faqs", publicFetchOpts).catch(() => [] as FAQ[]),
    getFromPrice(),
  ]);
  return faqs.length > 0
    ? [...faqs].sort((a, b) => a.sort_order - b.sort_order)
    : fallbackFaqs(fromPrice);
}
