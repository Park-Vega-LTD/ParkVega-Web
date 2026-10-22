import type { Metadata } from "next";
import { Suspense } from "react";
import { UtensilsCrossed } from "lucide-react";

import { FaqBlock } from "@/components/parkvega/faq-block";
import { FoodMenu } from "@/components/parkvega/food-menu";
import { FoodOrderSheet } from "@/components/parkvega/food-order/order-sheet";
import { SectionHeading } from "@/components/parkvega/page-hero";
import { publicFetch } from "@/lib/api.server";
import { getExtraOpenDates } from "@/lib/public-data";
import type { MenuItem, Restaurant } from "@/types/api";

// ISR: regenerate the restaurants page at most once every 60 seconds (Requirement 4.1).
export const revalidate = 60;

export const metadata: Metadata = {
  // Title: 48 chars (<= 60)
  title: "Restaurants & Menus | Park Vega Waterpark",
  // Description: 139 chars (<= 160)
  description:
    "Browse Park Vega's restaurants and their menus—Nigerian classics, family favourites, cool drinks and quick snacks served across the park.",
  openGraph: {
    title: "Restaurants & Menus | Park Vega Waterpark",
    description:
      "Nigerian classics, family favourites, cool drinks and quick snacks served across Park Vega in Agbor, Delta State.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Restaurants & Menus | Park Vega Waterpark",
    description:
      "Nigerian classics, family favourites, cool drinks and quick snacks served across Park Vega in Agbor, Delta State.",
  },
};

const fetchOpts = { next: { revalidate: 60 } } as const;

export default async function RestaurantsPage() {
  // Fetch the restaurant list first. A failure degrades to an empty list so
  // the page still renders (match the attractions/homepage pattern).
  const restaurants = await publicFetch<Restaurant[]>(
    "/restaurants",
    fetchOpts,
  ).catch(() => [] as Restaurant[]);

  // Show active restaurants on the public page (consistent with attractions
  // filtering out inactive entries).
  const activeRestaurants = restaurants.filter(
    (restaurant) => restaurant.active,
  );

  // Fetch each restaurant's menu in parallel. A single menu failure degrades
  // to an empty list so the rest of the page still renders.
  const menus = await Promise.all(
    activeRestaurants.map((restaurant) =>
      publicFetch<MenuItem[]>(
        `/restaurants/${restaurant.id}/menu`,
        fetchOpts,
      ).catch(() => [] as MenuItem[]),
    ),
  );

  const extraOpenDates = await getExtraOpenDates();

  return (
    <>
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
        <SectionHeading
          eyebrow="Eat, drink and refuel"
          title="Big flavours between big thrills."
          description="Order online and pick up in person at the counter – no waiting in line. Prices in Naira."
        />
      </section>

      {activeRestaurants.length === 0 ? (
        <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
          <div className="rounded-3xl border border-border bg-card p-10 text-center shadow-lg">
            <UtensilsCrossed className="mx-auto size-10 text-primary-ink" />
            <h3 className="mt-5 text-2xl font-semibold">
              Menus are being refreshed.
            </h3>
            <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
              Our restaurant line-up will be posted shortly. Check back soon for
              the full menu.
            </p>
          </div>
        </section>
      ) : (
        <div className="pb-12">
          {activeRestaurants.map((restaurant, index) => (
            <div key={restaurant.id}>
              <section className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
                <SectionHeading
                  eyebrow={restaurant.category}
                  title={restaurant.name}
                  description={restaurant.description ?? undefined}
                />
                {(restaurant.location || restaurant.opening_hours) && (
                  <p className="mt-3 text-sm text-muted-foreground">
                    {restaurant.location}
                    {restaurant.location && restaurant.opening_hours
                      ? " · "
                      : ""}
                    {restaurant.opening_hours}
                  </p>
                )}
              </section>
              {/* FoodMenu groups the items by category internally. */}
              <FoodMenu restaurantId={restaurant.id} items={menus[index]} />
            </div>
          ))}
        </div>
      )}
      {/* Suspense: the drawer reads `?order=resume` after a login round-trip. */}
      <Suspense fallback={null}>
        <FoodOrderSheet extraOpenDates={extraOpenDates} />
      </Suspense>
      <FaqBlock extra={[
          ["Can I bring my own food to Park Vega?", "No. Outside food, alcohol, glassware and bottles are not allowed. Park Vega Restaurant serves meals, snacks and drinks inside the park."],
          ["Can I order food online at Park Vega?", "Yes. Order on this website and pick up your food in person at the restaurant."],
        ]} />
    </>
  );
}
