import type { Metadata } from "next";

import { MyDayPlanner } from "@/components/parkvega/my-day-planner";
import { serverFetch } from "@/lib/api.server";
import { getSiteSettings } from "@/lib/public-data";
import type { Attraction } from "@/types/api";

// Attractions change rarely; cache with 60s ISR (Requirement 10.5). The
// interactive itinerary state lives entirely in the client child component.
export const revalidate = 60;

export function generateMetadata(): Metadata {
  return {
    // Title: 32 chars (<= 60)
    title: "My Day | Park Vega Waterpark",
    // Description: 118 chars (<= 160)
    description:
      "Plan your perfect day at Park Vega—add and remove attractions to build a personal itinerary and save it for later.",
  };
}

const fetchOpts = { next: { revalidate: 60 } } as const;

export default async function MyDayPage() {
  // A failed fetch degrades to an empty catalogue so the page still renders.
  const [attractions, settings] = await Promise.all([
    serverFetch<Attraction[]>("/attractions", fetchOpts).catch(
      () => [] as Attraction[],
    ),
    getSiteSettings(),
  ]);

  const activeAttractions = attractions.filter(
    (attraction) => attraction.status === "ACTIVE",
  );

  return (
    <section className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Plan My Day
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Build a personal itinerary of the attractions you want to hit.
        </p>
      </header>

      <MyDayPlanner
        initialAttractions={activeAttractions}
        extraOpenDates={settings.extra_open_dates}
      />
    </section>
  );
}
