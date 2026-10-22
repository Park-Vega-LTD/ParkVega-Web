import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";

import { EventCard } from "@/components/parkvega/event-card";
import { Billboard } from "@/components/parkvega/home/billboard";
import {
  AttractionsSection,
  CelebrateSection,
  FinalCta,
  GettingHereSection,
  PlanYourVisitSection,
  RestaurantSection,
  ReviewsSection,
  VisitorInfoCards,
  WhyParkVega,
} from "@/components/parkvega/home/sections";
import { FaqBlock } from "@/components/parkvega/faq-block";
import { JsonLd } from "@/components/parkvega/json-ld";
import { SectionHeading } from "@/components/parkvega/page-hero";
import { Button } from "@/components/ui/button";
import { publicFetch } from "@/lib/api.server";
import {
  FALLBACK_ATTRACTIONS,
  FALLBACK_MENU,
  type AttractionHighlight,
  type MenuHighlight,
} from "@/lib/home-content";
import { getFromPrice, getSiteSettings } from "@/lib/public-data";
import { eventSchemas, waterParkSchema } from "@/lib/schema";
import { formatNaira, shortDays } from "@/lib/site";
import type { Attraction, Event, MenuItem, Restaurant } from "@/types/api";

// ISR: regenerate the homepage at most once every 60 seconds (Requirement 4.1).
export const revalidate = 60;

// The title and description quote the live "Tickets from" price, so Google
// and link previews never show a stale price after staff change it.
export async function generateMetadata(): Promise<Metadata> {
  const [fromPrice, settings] = await Promise.all([getFromPrice(), getSiteSettings()]);
  const price = formatNaira(fromPrice);
  const title = `Park Vega Waterpark – Agbor, Delta State | Tickets from ${price}`;
  const description = `Wave pool, thrill slides and kids' splash zones in Agbor, Delta State. Open ${shortDays(settings.opening_days)}, ${settings.opening_hours}. Tickets from ${price} – buy online.`;
  return {
    title,
    description,
    alternates: { canonical: "/" },
    openGraph: { title, description, type: "website", images: [settings.hero_image_url ?? "/parkvega-hero.jpg"] },
    twitter: { card: "summary_large_image", title, description },
  };
}

const fetchOpts = { next: { revalidate: 60 } } as const;

/** An event is upcoming when it has at least one session on or after today. */
function hasUpcomingSession(event: Event, todayStr: string): boolean {
  return (event.sessions ?? []).some((s) => s.session_date >= todayStr);
}

function toHighlight(attraction: Attraction, index: number): AttractionHighlight {
  const tags = [
    attraction.height_requirement ? `Min. ${attraction.height_requirement}` : undefined,
    attraction.thrill_level ? `${attraction.thrill_level} thrill` : attraction.category,
  ].filter((tag): tag is string => Boolean(tag));
  return {
    name: attraction.name,
    description: attraction.description ?? "",
    tags,
    image:
      attraction.image_url ||
      FALLBACK_ATTRACTIONS[index % FALLBACK_ATTRACTIONS.length].image,
  };
}

/** Popular items from the first active restaurant's menu. */
async function getMenuHighlights(): Promise<MenuHighlight[]> {
  const restaurants = await publicFetch<Restaurant[]>("/restaurants", fetchOpts).catch(
    () => [] as Restaurant[],
  );
  const restaurant = restaurants.find((r) => r.active);
  if (!restaurant) return [];
  const menu = await publicFetch<MenuItem[]>(`/restaurants/${restaurant.id}/menu`, fetchOpts).catch(
    () => [] as MenuItem[],
  );
  const active = menu.filter((item) => item.active);
  const popular = active.filter((item) => item.popular);
  return (popular.length > 0 ? popular : active).slice(0, 4).map((item) => ({
    name: item.name,
    detail: item.description ?? undefined,
    price: item.price,
    label: item.popular ? "Popular choice" : item.category,
  }));
}

export default async function HomePage() {
  const todayStr = new Date().toISOString().slice(0, 10);

  // Fetch homepage data in parallel. Any single failure degrades to the
  // static fallback so the page still renders every section.
  const [attractions, events, fromPrice, menuHighlights, settings] = await Promise.all([
    publicFetch<Attraction[]>("/attractions", fetchOpts).catch(() => [] as Attraction[]),
    publicFetch<Event[]>("/events", fetchOpts).catch(() => [] as Event[]),
    getFromPrice(),
    getMenuHighlights(),
    getSiteSettings(),
  ]);

  const activeAttractions = attractions
    .filter((attraction) => attraction.status === "ACTIVE")
    .sort((a, b) => a.sort_order - b.sort_order);
  const attractionHighlights =
    activeAttractions.length > 0
      ? activeAttractions.slice(0, 6).map(toHighlight)
      : FALLBACK_ATTRACTIONS;

  const upcomingEvents = events
    .filter((event) => event.status === "PUBLISHED" && hasUpcomingSession(event, todayStr))
    .slice(0, 3);

  return (
    <>
      <JsonLd data={waterParkSchema(fromPrice)} />
      {eventSchemas(events, fromPrice, todayStr).map((schema, index) => (
        <JsonLd key={index} data={schema} />
      ))}

      <Billboard fromPrice={fromPrice} settings={settings} />
      <WhyParkVega />
      <AttractionsSection items={attractionHighlights} />
      <VisitorInfoCards fromPrice={fromPrice} />
      <PlanYourVisitSection fromPrice={fromPrice} />
      <RestaurantSection items={menuHighlights.length > 0 ? menuHighlights : FALLBACK_MENU} />

      {upcomingEvents.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <SectionHeading
              eyebrow="Save the date"
              title="What's coming up at the park."
              description="Holiday openings, special park days and promos worth marking in your calendar."
            />
            <Button asChild variant="outline">
              <Link href="/events">
                See all events <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
          <div className="mt-9 grid gap-5 md:grid-cols-3">
            {upcomingEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      )}

      <CelebrateSection />
      <GettingHereSection />
      <ReviewsSection />
      <FaqBlock />
      <FinalCta fromPrice={fromPrice} />
    </>
  );
}
