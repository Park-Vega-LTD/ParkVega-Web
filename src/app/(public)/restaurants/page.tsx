import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { ArrowDown, Clock3, ShoppingBag, UtensilsCrossed } from "lucide-react";

import { FaqBlock } from "@/components/parkvega/faq-block";
import { MenuApp } from "@/components/parkvega/food-order/menu-app";
import { FoodOrderSheet } from "@/components/parkvega/food-order/order-sheet";
import { publicFetch } from "@/lib/api.server";
import { isMenuPhoto } from "@/lib/menu";
import { getExtraOpenDates } from "@/lib/public-data";
import { cn } from "@/lib/utils";
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
    images: ["/restaurant/bbq-chicken.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Restaurants & Menus | Park Vega Waterpark",
    description:
      "Nigerian classics, family favourites, cool drinks and quick snacks served across Park Vega in Agbor, Delta State.",
    images: ["/restaurant/bbq-chicken.jpg"],
  },
};

/** Shown in the header only when the API has fewer than three dish photos. */
const FALLBACK_PHOTOS = [
  { src: "/restaurant/bbq-chicken.jpg", alt: "Glazed barbecue chicken quarter served with chunky chips" },
  { src: "/restaurant/fried-rice.jpg", alt: "Fried rice with sweetcorn, peas and greens, served with spicy beef" },
  { src: "/restaurant/blue-lime-drink.jpg", alt: "Chilled blue drink in a martini glass garnished with a lime slice" },
];

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

  const menuData = activeRestaurants.map((restaurant, index) => ({ restaurant, items: menus[index] }));
  const allItems = menus.flat();
  // Header photos: staff dish photos first (popular dishes lead), topped up with the stock shots.
  const photos = [
    ...allItems
      .filter((item) => item.active && isMenuPhoto(item.image_url))
      .sort((a, b) => Number(b.popular) - Number(a.popular))
      .map((item) => ({ src: item.image_url as string, alt: item.name })),
    ...FALLBACK_PHOTOS,
  ]
    .filter((photo, i, all) => all.findIndex((other) => other.src === photo.src) === i)
    .slice(0, 3);
  const availableCount = allItems.filter((item) => item.active).length;
  const restaurant = activeRestaurants[0];

  return (
    <>
      <section className="bg-deep text-hero-foreground">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:py-16">
          <div>
            <span className="text-sm font-bold uppercase tracking-wide text-secondary">Eat, drink and refuel</span>
            <h1 className="mt-3 max-w-xl text-balance text-4xl font-bold leading-tight sm:text-5xl">Big flavours between big thrills.</h1>
            <p className="mt-4 max-w-lg text-lg text-hero-foreground/75">
              Order from your phone, pay online and pick up at the counter – no waiting in line.
            </p>
            <ul className="mt-6 flex flex-wrap gap-2 text-sm font-semibold">
              {restaurant?.opening_hours && (
                <li className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-2"><Clock3 className="size-4 text-secondary" aria-hidden="true" />Kitchen {restaurant.opening_hours}</li>
              )}
              <li className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-2"><ShoppingBag className="size-4 text-secondary" aria-hidden="true" />Pickup at the counter</li>
              {availableCount > 0 && (
                <li className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-2"><UtensilsCrossed className="size-4 text-secondary" aria-hidden="true" />{availableCount} dishes available today</li>
              )}
            </ul>
            {menuData.length > 0 && (
              <a href="#menu" className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-2xl bg-secondary px-6 font-bold text-secondary-foreground transition-colors hover:bg-secondary-hover">
                Start your order <ArrowDown className="size-4" aria-hidden="true" />
              </a>
            )}
          </div>
          <div className="grid grid-cols-[1.3fr_1fr] grid-rows-2 gap-3 sm:gap-4">
            {photos.map((photo, i) => (
              <div key={photo.src} className={cn("relative overflow-hidden rounded-3xl bg-white/10", i === 0 ? "row-span-2 aspect-[4/5]" : "aspect-square")}>
                <Image src={photo.src} alt={photo.alt} fill priority={i === 0} sizes="(max-width: 1024px) 50vw, 25vw" className="object-cover" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {menuData.length === 0 ? (
        <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
          <div className="rounded-3xl border border-border bg-card p-10 text-center shadow-lg">
            <UtensilsCrossed className="mx-auto size-10 text-primary-ink" />
            <h2 className="mt-5 text-2xl font-semibold">
              Menus are being refreshed.
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
              Our restaurant line-up will be posted shortly. Check back soon for
              the full menu.
            </p>
          </div>
        </section>
      ) : (
        <MenuApp menus={menuData} />
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
