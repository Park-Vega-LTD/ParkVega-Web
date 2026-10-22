import type { Metadata } from "next";

import { AttractionsFilter } from "@/components/parkvega/attractions-filter";
import { FaqBlock } from "@/components/parkvega/faq-block";
import { SectionHeading } from "@/components/parkvega/page-hero";
import { publicFetch } from "@/lib/api.server";
import type { Attraction } from "@/types/api";

// ISR: regenerate the attractions page at most once every 60 seconds (Requirement 4.1).
export const revalidate = 60;

export const metadata: Metadata = {
  // Title: 47 chars (<= 60)
  title: "Attractions | Park Vega Waterpark in Agbor",
  // Description: 134 chars (<= 160)
  description:
    "Explore every Park Vega attraction—thrill rides, family pools, kids zones and relaxing spots—and find the perfect splash for your day.",
  openGraph: {
    title: "Attractions | Park Vega Waterpark in Agbor",
    description:
      "Thrill rides, family pools, kids zones and relaxing spots at Park Vega in Agbor, Delta State.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Attractions | Park Vega Waterpark in Agbor",
    description:
      "Thrill rides, family pools, kids zones and relaxing spots at Park Vega in Agbor, Delta State.",
  },
};

const fetchOpts = { next: { revalidate: 60 } } as const;

export default async function AttractionsPage() {
  // Fetch all attractions. A failure degrades to an empty list so the page
  // still renders (match the homepage pattern).
  const attractions = await publicFetch<Attraction[]>(
    "/attractions",
    fetchOpts,
  ).catch(() => [] as Attraction[]);

  const activeAttractions = attractions.filter(
    (attraction) => attraction.status === "ACTIVE",
  );

  return (
    <>
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
        <SectionHeading
          eyebrow="Find your kind of fun"
          title="Every way to splash at Park Vega."
          description="Browse the full line-up and filter by the kind of adventure you're after—from heart-racing thrills to gentle family zones."
        />
        <div className="mt-9">
          <AttractionsFilter attractions={activeAttractions} />
        </div>
      </section>
      <FaqBlock extra={[
          ["Is Park Vega good for kids?", "Yes. Younger children have the Aqua Tower, Kids Splash Zone and zero-depth pools, while the big slides need a minimum height of 120cm. Children under 150cm must be with an adult."],
          ["How many attractions does Park Vega have?", "Park Vega has 15 attractions, including the Wave Pool, thrill slides, the Aqua Tower and the Relax Pool with a swim-up bar. One ticket covers unlimited rides on all of them."],
        ]} />
    </>
  );
}
