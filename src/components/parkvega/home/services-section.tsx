import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ChevronRight,
  LifeBuoy,
  QrCode,
  Umbrella,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";

import { SectionHeading } from "@/components/parkvega/page-hero";
import { Button } from "@/components/ui/button";
import { SERVICE_CATEGORIES } from "@/lib/services-content";
import type { Photo } from "@/lib/site-photos";

/** Inline style that staggers a `data-reveal` element by its position in a list. */
const stagger = (i: number) => ({ "--i": i }) as CSSProperties;

/** Shared hover lift for cards, same as the other homepage sections. */
const CARD_HOVER =
  "transition-[translate,box-shadow,border-color] duration-300 ease-out hover:-translate-y-1.5 hover:border-primary/50 hover:shadow-[var(--shadow-card)]";

const ICONS: Record<string, LucideIcon> = {
  comfort: Umbrella,
  dining: UtensilsCrossed,
  safety: LifeBuoy,
  tools: QrCode,
};

const PHOTOS = "https://res.cloudinary.com/rlenhslv/image/upload";

/**
 * Real Park Vega photos for each service group, in category order (comfort,
 * dining, safety, tools). Staff can replace any of them by choosing photos
 * for the `home/services` spot under Page images in the console.
 */
export const DEFAULT_SERVICE_PHOTOS: Photo[] = [
  {
    src: `${PHOTOS}/v1794921963/parkvega/site/photos/services/cabanas.jpg`,
    alt: "Row of private cabanas beside the splash pad at Park Vega",
  },
  {
    src: `${PHOTOS}/v1794921966/parkvega/site/photos/services/restaurant-wings.jpg`,
    alt: "Glazed chicken wings with coleslaw from the Park Vega Restaurant",
  },
  {
    src: `${PHOTOS}/v1794921964/parkvega/site/photos/services/life-jackets.webp`,
    alt: "Rack of free life jackets for non-swimmers at Park Vega",
  },
  {
    src: `${PHOTOS}/v1793463025/parkvega/site/photos/wave-pool-crowd.jpg`,
    alt: "Guests enjoying the Wave Pool at Park Vega",
  },
];

/** A pill that hangs off the bottom of one card, like a "new" callout. */
const CALLOUTS: Partial<Record<string, { label: string; text: string; href: string }>> = {
  dining: { label: "New", text: "Order food ahead", href: "/restaurants" },
};

/**
 * Homepage "services" band: one tall photo card per guest-service group,
 * each linking to its section on /services.
 */
export function ServicesSection({ photos }: { photos: Photo[] }) {
  return (
    <section id="home-services" aria-label="Guest services" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <SectionHeading
          eyebrow="Guest services"
          title="Everything that makes a full day easy."
          description="Cabanas, food, lifeguards and handy digital tools, all part of your day at Park Vega."
        />
        <Button asChild variant="outline" data-reveal style={stagger(2)} className="group shrink-0">
          <Link href="/services">
            All services <ArrowRight className="size-4 transition-[translate] duration-300 group-hover:translate-x-1" />
          </Link>
        </Button>
      </div>

      <ul className="mt-9 grid gap-10 pb-5 sm:grid-cols-2 sm:gap-x-5 lg:grid-cols-4 lg:gap-5">
        {SERVICE_CATEGORIES.map((category, i) => {
          const Icon = ICONS[category.id] ?? Umbrella;
          const photo = photos[i] ?? DEFAULT_SERVICE_PHOTOS[i];
          const callout = CALLOUTS[category.id];
          return (
            <li key={category.id} data-reveal style={stagger(i)} className="relative">
              <article
                className={`group relative aspect-[4/5] overflow-hidden rounded-3xl border border-border bg-deep ${CARD_HOVER}`}
              >
                {photo && (
                  <Image
                    src={photo.src}
                    alt={photo.alt}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover transition-[scale] duration-700 ease-out group-hover:scale-110"
                  />
                )}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-deep via-deep/80 via-50% to-deep/0 to-85%"
                />

                {/* Icon chip, same style as the "Why Park Vega" cards */}
                <span
                  aria-hidden="true"
                  className="absolute right-4 top-4 grid size-12 place-items-center rounded-2xl bg-ocean-soft text-primary-ink shadow-[var(--shadow-card)] transition-[rotate,scale] duration-300 group-hover:-rotate-6 group-hover:scale-110"
                >
                  <Icon className="size-6" />
                </span>

                <div className={`absolute inset-x-0 bottom-0 p-6 ${callout ? "pb-10" : ""}`}>
                  <span className="inline-block rounded-full bg-secondary px-2.5 py-0.5 text-[0.7rem] font-extrabold uppercase tracking-wide text-secondary-foreground">
                    {category.label}
                  </span>
                  <h3 className="mt-2text-2xl font-semibold leading-tight text-hero-foreground">
                    {/* Stretched link: the whole card opens the matching /services section. */}
                    <Link
                      href={`/services#${category.id}`}
                      className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:rounded-3xl focus-visible:after:ring-4 focus-visible:after:ring-primary"
                    >
                      {category.title.replace(/\.$/, "")}
                    </Link>
                  </h3>
                  <ul className="mt-4 flex flex-wrap gap-1.5">
                    {category.items.slice(0, 2).map((item) => (
                      <li
                        key={item.title}
                        className="rounded-full bg-hero-foreground/15 px-3 py-1 text-xs font-bold text-hero-foreground backdrop-blur-sm"
                      >
                        {item.title}
                      </li>
                    ))}
                  </ul>
                </div>
              </article>

              {callout && (
                <Link
                  href={callout.href}
                  className="group/pill absolute -bottom-5 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full border border-border bg-card py-2 pl-2 pr-4 text-sm font-bold text-foreground shadow-[var(--shadow-card)] transition-[translate,border-color] duration-300 hover:-translate-y-0.5 hover:border-primary"
                >
                  <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-extrabold uppercase text-secondary-foreground">
                    {callout.label}
                  </span>
                  {callout.text}
                  <ChevronRight className="size-4 text-primary-ink transition-[translate] duration-300 group-hover/pill:translate-x-0.5" />
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
