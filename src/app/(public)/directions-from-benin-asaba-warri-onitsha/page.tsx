import Image from "next/image";
import type { Metadata } from "next";
import { Bus, Car, Clock3, Expand, Landmark, Map as MapIcon, MapPin, Navigation } from "lucide-react";

import { FaqBlock } from "@/components/parkvega/faq-block";
import { PageHero } from "@/components/parkvega/page-hero";
import { WhatsAppButton } from "@/components/parkvega/whatsapp-button";
import { Button } from "@/components/ui/button";
import { getSpotPhoto } from "@/lib/public-data";
import { DEFAULT_HERO_PHOTOS } from "@/lib/site-photos";
import { ADDRESS, MAPS_URL, directionsUrl } from "@/lib/site";
import { CITY_DIRECTIONS } from "@/lib/visit-content";

// ISR: regenerate at most once every 60 seconds (Requirement 4.1).
export const revalidate = 60;

const TITLE = "Directions to Park Vega from Benin, Asaba, Warri & Onitsha";
const DESCRIPTION =
  "How to get to Park Vega Waterpark in Agbor from Benin City, Asaba, Warri and Onitsha: driving routes, travel times, landmarks, buses and maps.";

/** The `directions/hero` photo staff chose, or null when none is set. */
const getHero = async () => (await getSpotPhoto("directions", "hero")) ?? DEFAULT_HERO_PHOTOS.directions;

export async function generateMetadata(): Promise<Metadata> {
  const hero = await getHero();
  return {
    title: TITLE,
    description: DESCRIPTION,
    alternates: { canonical: "/directions-from-benin-asaba-warri-onitsha" },
    openGraph: { title: TITLE, description: DESCRIPTION, type: "website", images: hero ? [hero.src] : undefined },
    twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
  };
}

const DESTINATION = "Park Vega Waterpark, Agbor, Delta State";

const PARK_MAP = {
  src: "https://res.cloudinary.com/rlenhslv/image/upload/v1794922273/parkvega/site/photos/park-map.jpg",
  width: 1929,
  height: 2000,
};

/** Numbered spots on the park map, in the map's own numbering. */
const MAP_LEGEND: { name: string; note: string; href?: string }[] = [
  { name: "Car park", note: "Park close to the entrance" },
  { name: "Entrance building", note: "Show your ticket QR code here" },
  { name: "Food station", note: "Snacks and drinks between rides", href: "/restaurants" },
  { name: "Swim-up bar", note: "Drinks without leaving the water" },
  { name: "Wave pool", note: "Ocean-style waves for all ages", href: "/attractions" },
  { name: "Cabanas", note: "Private shade for up to 12 guests", href: "/services#cabanas" },
  { name: "Water slides", note: "Our tallest thrill slides", href: "/attractions" },
  { name: "Flavor Grill Restaurant", note: "Full meals, served all day", href: "/restaurants" },
  { name: "Activity pool", note: "Floats, games and splashing", href: "/attractions" },
  { name: "Aqua Tower", note: "50-feature kids' play tower", href: "/attractions" },
  { name: "Splash pad", note: "Zero-depth fun for little ones", href: "/attractions" },
];

/** Keyless Google Maps route embed. */
function embedUrl(origin: string) {
  return `https://maps.google.com/maps?saddr=${encodeURIComponent(origin)}&daddr=${encodeURIComponent(DESTINATION)}&output=embed`;
}

export default async function DirectionsPage() {
  const hero = await getHero();
  return (
    <>
      <PageHero
        eyebrow="Getting here"
        title="Directions to Park Vega."
        description={`${ADDRESS}. Easy to reach from Benin City, Asaba, Warri and Onitsha.`}
        image={hero?.src}
        imageAlt={hero?.alt}
        ticketCta
      />

      <nav aria-label="Choose your city" className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {CITY_DIRECTIONS.map(({ slug, city, driveTime }) => (
            <li key={slug}>
              <a
                href={`#${slug}`}
                className="block rounded-2xl border border-border bg-card p-4 hover:border-primary"
              >
                <span className="block font-semibold">From {city}</span>
                <span className="text-sm text-muted-foreground">{driveTime}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {CITY_DIRECTIONS.map(({ slug, city, origin, distance, driveTime, steps, landmarks, publicTransport }, index) => (
        <section
          key={slug}
          id={slug}
          aria-labelledby={`${slug}-title`}
          className={index % 2 === 1 ? "scroll-mt-24 bg-ocean-soft/50 py-16" : "scroll-mt-24 py-16"}
        >
          <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-2">
            <div>
              <h2 id={`${slug}-title`} className="text-3xl font-semibold sm:text-4xl">
                {city} → Park Vega
              </h2>
              <div className="mt-4 flex flex-wrap gap-2 text-sm">
                <span className="flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 font-semibold ring-1 ring-border">
                  <Clock3 className="size-4 text-primary-ink" /> {driveTime}
                </span>
                <span className="flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 font-semibold ring-1 ring-border">
                  <MapPin className="size-4 text-primary-ink" /> {distance}
                </span>
              </div>

              <h3 className="mt-7 flex items-center gap-2 text-lg font-semibold">
                <Car className="size-5 text-primary-ink" /> Driving directions
              </h3>
              <ol className="mt-3 grid gap-2 text-sm">
                {steps.map((step, stepIndex) => (
                  <li key={step} className="flex gap-3">
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      {stepIndex + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>

              <h3 className="mt-7 flex items-center gap-2 text-lg font-semibold">
                <Landmark className="size-5 text-primary-ink" /> Landmarks on the way
              </h3>
              <ul className="mt-3 flex flex-wrap gap-2">
                {landmarks.map((landmark) => (
                  <li key={landmark} className="rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold">
                    {landmark}
                  </li>
                ))}
              </ul>

              <h3 className="mt-7 flex items-center gap-2 text-lg font-semibold">
                <Bus className="size-5 text-primary-ink" /> Public transport
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{publicTransport}</p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Button asChild>
                  <a href={directionsUrl(origin)} target="_blank" rel="noopener noreferrer">
                    <Navigation className="size-4" /> Start directions
                  </a>
                </Button>
                <WhatsAppButton variant="outline" message={`Hi Park Vega! I'm coming from ${city} – can you help with directions?`}>
                  Ask on WhatsApp
                </WhatsAppButton>
              </div>
            </div>
            <div className="overflow-hidden rounded-3xl border border-border bg-muted">
              <iframe
                src={embedUrl(origin)}
                title={`Map: driving route from ${city} to Park Vega Waterpark`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="aspect-[4/3] size-full min-h-80"
              />
            </div>
          </div>
        </section>
      ))}

      <section
        id="park-map"
        aria-labelledby="park-map-title"
        className={`scroll-mt-24 py-16 ${CITY_DIRECTIONS.length % 2 === 1 ? "bg-ocean-soft/50" : ""}`}
      >
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-12 lg:items-start">
          <div className="lg:col-span-7">
            <a
              href={PARK_MAP.src}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative block overflow-hidden rounded-3xl border border-border bg-card"
            >
              <Image
                src={PARK_MAP.src}
                alt="Illustrated map of Park Vega Waterpark showing the car park, entrance, pools, slides, cabanas, restaurants and kids' areas, numbered 1 to 11"
                width={PARK_MAP.width}
                height={PARK_MAP.height}
                sizes="(max-width: 1024px) 100vw, 58vw"
                className="h-auto w-full transition-[scale] duration-500 ease-out group-hover:scale-[1.02]"
              />
              <span className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-card/95 px-3 py-1.5 text-xs font-bold shadow-[var(--shadow-card)] ring-1 ring-border">
                <Expand className="size-3.5 text-primary-ink" /> Full size
              </span>
            </a>
          </div>

          <div className="lg:sticky lg:top-24 lg:col-span-5">
            <span className="block text-sm font-bold uppercase tracking-wide text-primary-ink">Once you&apos;re here</span>
            <h2 id="park-map-title" className="mt-2 text-3xl font-semibold sm:text-4xl">
              Find your way around the park.
            </h2>
            <p className="mt-3 text-muted-foreground">
              Park at the front, walk through the entrance building and the whole park opens up in front of you.
            </p>
            <ol className="mt-7 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {MAP_LEGEND.map(({ name, note, href }, index) => {
                const body = (
                  <>
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-destructive font-display text-sm font-bold text-white ring-2 ring-white">
                      {index + 1}
                    </span>
                    <span>
                      <span className="block font-semibold leading-tight">{name}</span>
                      <span className="text-xs text-muted-foreground">{note}</span>
                    </span>
                  </>
                );
                const itemClass = "flex items-center gap-3 rounded-2xl border border-border bg-card p-3";
                return (
                  <li key={name}>
                    {href ? (
                      <a href={href} className={`${itemClass} transition-colors hover:border-primary`}>
                        {body}
                      </a>
                    ) : (
                      <div className={itemClass}>{body}</div>
                    )}
                  </li>
                );
              })}
            </ol>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild variant="outline">
                <a href={PARK_MAP.src} target="_blank" rel="noopener noreferrer">
                  <MapIcon className="size-4" /> Open the park map
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-4 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-4 rounded-3xl bg-deep p-6 text-hero-foreground sm:flex-row sm:items-center sm:p-8">
          <p className="text-lg font-semibold">Coming from somewhere else?</p>
          <Button asChild variant="ticket">
            <a href={MAPS_URL} target="_blank" rel="noopener noreferrer">
              <MapPin className="size-4" /> Open Park Vega in Google Maps
            </a>
          </Button>
        </div>
      </section>

      <FaqBlock
        title="Travel questions."
        limit={7}
        page="directions"
      />
    </>
  );
}
