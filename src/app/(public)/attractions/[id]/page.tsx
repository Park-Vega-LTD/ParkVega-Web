import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarClock, Gauge, Ruler, ShieldCheck, Users } from "lucide-react";

import { SectionHeading } from "@/components/parkvega/page-hero";
import { ApiError, publicFetch } from "@/lib/api.server";
import { safetyList } from "@/lib/attractions";
import type { Attraction } from "@/types/api";

// ISR: regenerate each attraction detail page at most once every 60 seconds
// (Requirement 4.4).
export const revalidate = 60;

const FALLBACK_IMAGE = "/photos/slide-tower-tubes.jpg";

const fetchOpts = { next: { revalidate: 60 } } as const;

// SEO fallbacks used when the REST API is unavailable (Requirement 5.2).
const FALLBACK_TITLE = "Attraction | Park Vega Waterpark";
const FALLBACK_DESCRIPTION =
  "Explore attractions, schedules and thrills at Park Vega Waterpark in Agbor, Delta State.";

/** Truncate text to a maximum length, appending an ellipsis when cut. */
function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

type PageProps = {
  params: Promise<{ id: string }>;
};

/**
 * Pre-render a static page for every attraction at build time. If the REST API
 * is unreachable, return an empty list so the build completes with zero
 * pre-rendered pages and falls back to request-time rendering (Requirement 4.5).
 */
export async function generateStaticParams(): Promise<{ id: string }[]> {
  try {
    const attractions = await publicFetch<Attraction[]>("/attractions", fetchOpts);
    return attractions.map((attraction) => ({ id: attraction.id }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;

  try {
    const attraction = await publicFetch<Attraction>(`/attractions/${id}`, fetchOpts);

    const title = truncate(`${attraction.name} | Park Vega`, 60);
    const description = truncate(
      attraction.description ??
        `Discover ${attraction.name} at Park Vega Waterpark in Agbor, Delta State.`,
      160,
    );

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "article",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
      },
    };
  } catch {
    // Any failure (including 404) degrades to a static fallback (Requirement 5.2).
    return {
      title: FALLBACK_TITLE,
      description: FALLBACK_DESCRIPTION,
      openGraph: {
        title: FALLBACK_TITLE,
        description: FALLBACK_DESCRIPTION,
        type: "article",
      },
      twitter: {
        card: "summary_large_image",
        title: FALLBACK_TITLE,
        description: FALLBACK_DESCRIPTION,
      },
    };
  }
}

export default async function AttractionDetailPage({ params }: PageProps) {
  const { id } = await params;

  let attraction: Attraction;
  try {
    attraction = await publicFetch<Attraction>(`/attractions/${id}`, fetchOpts);
  } catch (err) {
    // A 404 from the REST API means the attraction does not exist — render the
    // Next.js not-found page (Requirement 4.4).
    if (err instanceof ApiError && err.status === 404) {
      notFound();
    }
    throw err;
  }

  const schedules = attraction.schedules ?? [];
  const safety = safetyList(attraction);

  return (
    <>
      <section className="px-3 py-3 sm:px-6 sm:py-5">
        <div className="relative mx-auto min-h-[460px] max-w-7xl overflow-hidden rounded-3xl bg-foreground">
          <Image
            src={attraction.image_url || FALLBACK_IMAGE}
            alt={attraction.name}
            fill
            sizes="100vw"
            preload
            className="absolute inset-0 size-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/95 via-foreground/60 to-transparent" />
          <div className="relative flex min-h-[460px] max-w-2xl flex-col justify-end p-6 pb-12 sm:p-12">
            <span className="text-xs font-extrabold uppercase text-secondary">
              {attraction.category}
            </span>
            <h1 className="mt-3 text-balance text-[2.25rem] font-bold leading-tight text-hero-foreground sm:text-5xl">
              {attraction.name}
            </h1>
            {attraction.description && (
              <p className="mt-5 max-w-xl text-base leading-relaxed text-hero-foreground/80 sm:text-lg">
                {attraction.description}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-lg">
            <Users className="mb-3 size-6 text-primary-ink" />
            <span className="block text-[11px] font-bold uppercase text-muted-foreground">
              Who it suits
            </span>
            <span className="mt-1 block text-lg font-semibold">
              {attraction.who_it_suits ?? "Ask our team which rides suit your group"}
            </span>
          </div>
          <div className="rounded-3xl border border-border bg-card p-6 shadow-lg">
            <Gauge className="mb-3 size-6 text-primary-ink" />
            <span className="block text-[11px] font-bold uppercase text-muted-foreground">
              Thrill level
            </span>
            <span className="mt-1 block text-lg font-semibold">
              {attraction.thrill_level ?? "Ask our team"}
            </span>
          </div>
          <div className="rounded-3xl border border-border bg-card p-6 shadow-lg">
            <Ruler className="mb-3 size-6 text-primary-ink" />
            <span className="block text-[11px] font-bold uppercase text-muted-foreground">
              Height requirement
            </span>
            <span className="mt-1 block text-lg font-semibold">
              {attraction.height_requirement ?? "Height guidance at entrance"}
            </span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <div className="rounded-3xl bg-deep p-6 text-hero-foreground sm:p-8">
          <h2 className="flex items-center gap-2 text-2xl font-semibold">
            <ShieldCheck className="size-6 text-secondary" /> Safety precautions
          </h2>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {(safety.length > 0
              ? safety
              : [
                  "Listen to staff advice on how to ride safely",
                  "No jewellery on rides",
                  "Non-swimmers must wear a life jacket",
                  "Children under 150cm must be with an adult",
                ]
            ).map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-hero-foreground/85">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-secondary" /> {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
        <SectionHeading
          eyebrow="When to visit"
          title="Opening schedule."
          description="Plan your splash around the hours below."
        />
        {schedules.length > 0 ? (
          <ul className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {schedules.map((schedule) => (
              <li
                key={schedule.id}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm"
              >
                <CalendarClock className="size-5 text-primary-ink" />
                <div>
                  <span className="block text-sm font-semibold">
                    {schedule.day_of_week}
                  </span>
                  <span className="block text-sm text-muted-foreground">
                    {schedule.open_time} – {schedule.close_time}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-9 rounded-3xl border border-border bg-card p-10 text-center shadow-lg">
            <CalendarClock className="mx-auto size-10 text-primary-ink" />
            <h3 className="mt-5 text-2xl font-semibold">
              Schedule coming soon.
            </h3>
            <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
              Opening hours for this attraction haven&apos;t been published yet.
              Check back shortly.
            </p>
          </div>
        )}
      </section>
    </>
  );
}
