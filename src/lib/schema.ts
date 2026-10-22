import {
  ADDRESS,
  EMAIL,
  MAPS_URL,
  PHONE_E164,
  SITE_URL,
  formatNaira,
} from "@/lib/site";
import type { Event, FAQ } from "@/types/api";

/**
 * schema.org builders (brief §5). Search engines and AI assistants read these
 * JSON-LD blocks to answer questions about prices, hours, events and FAQs.
 */

/** Nigeria is on West Africa Time all year (no daylight saving). */
const WAT_OFFSET = "+01:00";

const PLACE = {
  "@type": "Place",
  name: "Park Vega Waterpark",
  address: {
    "@type": "PostalAddress",
    streetAddress: ADDRESS.split(", Agbor")[0],
    addressLocality: "Agbor",
    addressRegion: "Delta State",
    addressCountry: "NG",
  },
};

export function waterParkSchema(fromPrice: number) {
  return {
    "@context": "https://schema.org",
    "@type": "WaterPark",
    "@id": `${SITE_URL}/#waterpark`,
    name: "Park Vega Waterpark",
    slogan: "Delivering Your Kind Of Fun",
    url: SITE_URL,
    image: `${SITE_URL}/parkvega-hero.jpg`,
    telephone: PHONE_E164,
    email: EMAIL,
    priceRange: `From ${formatNaira(fromPrice)}`,
    currenciesAccepted: "NGN",
    hasMap: MAPS_URL,
    address: PLACE.address,
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Thursday", "Friday", "Saturday", "Sunday"],
        opens: "11:00",
        closes: "18:00",
      },
    ],
  };
}

export function faqPageSchema(faqs: FAQ[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };
}

/**
 * One Event per upcoming session of each published event, generated from the
 * events API so the markup stays in sync with what marketing publishes.
 */
export function eventSchemas(events: Event[], fromPrice: number, today: string) {
  return events
    .filter((event) => event.status === "PUBLISHED")
    .flatMap((event) =>
      (event.sessions ?? [])
        .filter((session) => session.session_date >= today)
        .map((session) => ({
          "@context": "https://schema.org",
          "@type": "Event",
          name: event.title,
          description: event.description ?? undefined,
          image: event.image_url ?? `${SITE_URL}/parkvega-hero.jpg`,
          startDate: session.start_time
            ? `${session.session_date}T${session.start_time}${WAT_OFFSET}`
            : session.session_date,
          eventStatus: "https://schema.org/EventScheduled",
          eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
          location: PLACE,
          organizer: { "@type": "Organization", name: "Park Vega Waterpark", url: SITE_URL },
          offers: {
            "@type": "Offer",
            url: `${SITE_URL}/tickets`,
            price: fromPrice,
            priceCurrency: "NGN",
            availability:
              session.seats_available > 0
                ? "https://schema.org/InStock"
                : "https://schema.org/SoldOut",
          },
        })),
    );
}
