import type { Metadata } from "next";
import { Bus, Car, Clock3, Landmark, MapPin, Navigation } from "lucide-react";

import { FaqBlock } from "@/components/parkvega/faq-block";
import { PageHero } from "@/components/parkvega/page-hero";
import { WhatsAppButton } from "@/components/parkvega/whatsapp-button";
import { Button } from "@/components/ui/button";
import { ADDRESS, MAPS_URL, directionsUrl } from "@/lib/site";
import { CITY_DIRECTIONS } from "@/lib/visit-content";

// ISR: regenerate at most once every 60 seconds (Requirement 4.1).
export const revalidate = 60;

const TITLE = "Directions to Park Vega from Benin, Asaba, Warri & Onitsha";
const DESCRIPTION =
  "How to get to Park Vega Waterpark in Agbor from Benin City, Asaba, Warri and Onitsha: driving routes, travel times, landmarks, buses and maps.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/directions-from-benin-asaba-warri-onitsha" },
  openGraph: { title: TITLE, description: DESCRIPTION, type: "website" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

const DESTINATION = "Park Vega Waterpark, Agbor, Delta State";

/** Keyless Google Maps route embed. */
function embedUrl(origin: string) {
  return `https://maps.google.com/maps?saddr=${encodeURIComponent(origin)}&daddr=${encodeURIComponent(DESTINATION)}&output=embed`;
}

export default function DirectionsPage() {
  return (
    <>
      <PageHero
        eyebrow="Getting here"
        title="Directions to Park Vega."
        description={`${ADDRESS}. Easy to reach from Benin City, Asaba, Warri and Onitsha.`}
        image="/lazy-river.jpg"
        imageAlt="The relaxing pool at Park Vega Waterpark"
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
        extra={[
          [
            "How far is Park Vega from Benin City?",
            `Park Vega is ${CITY_DIRECTIONS[0].distance} from Benin City, ${CITY_DIRECTIONS[0].driveTime} by car along the Benin–Asaba Expressway.`,
          ],
          [
            "How far is Park Vega from Asaba?",
            `Park Vega is ${CITY_DIRECTIONS[1].distance} from Asaba, ${CITY_DIRECTIONS[1].driveTime} by car heading west on the Benin–Asaba Expressway.`,
          ],
          [
            "How do I get to Park Vega from Warri?",
            `Drive north-east through Abraka and Obiaruku to Agbor – ${CITY_DIRECTIONS[2].distance}, ${CITY_DIRECTIONS[2].driveTime}.`,
          ],
          [
            "How do I get to Park Vega from Onitsha?",
            `Cross the River Niger into Asaba, then head west on the Benin–Asaba Expressway to Agbor – ${CITY_DIRECTIONS[3].distance}, ${CITY_DIRECTIONS[3].driveTime}.`,
          ],
        ]}
      />
    </>
  );
}
