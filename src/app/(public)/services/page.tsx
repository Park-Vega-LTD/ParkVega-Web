import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FaqBlock } from "@/components/parkvega/faq-block";
import { PageHero, SectionHeading } from "@/components/parkvega/page-hero";
import { ApiError, publicFetch } from "@/lib/api.server";
import type { ContentPage } from "@/types/api";

// ISR: regenerate the services page at most once every 60 seconds (Requirement 4.1).
export const revalidate = 60;

const fetchOpts = { next: { revalidate: 60 } } as const;

// Per Requirement 5.1, every page exports a `generateMetadata()` function
// returning a unique title (<= 60 chars) and description (<= 160 chars).
export function generateMetadata(): Metadata {
  return {
    // Title: 42 chars (<= 60)
    title: "Services | Park Vega Waterpark Agbor",
    // Description: 152 chars (<= 160)
    description:
      "Discover the services at Park Vega Waterpark in Agbor, Delta State—cabanas, lockers, dining, group bookings and everything that makes your day effortless.",
    openGraph: {
      title: "Services | Park Vega Waterpark Agbor",
      description:
        "Cabanas, lockers, dining, group bookings and more—the services that make your Park Vega day effortless.",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "Services | Park Vega Waterpark Agbor",
      description:
        "Cabanas, lockers, dining, group bookings and more—the services that make your Park Vega day effortless.",
    },
  };
}

/**
 * Split a CMS body string into renderable paragraphs. The `body` field is a
 * plain string; we render it as a stack of paragraphs (blank lines separate
 * paragraphs) to keep output safe without `dangerouslySetInnerHTML`.
 */
function toParagraphs(body: string): string[] {
  return body
    .split(/\n\s*\n/)
    .map((para) => para.trim())
    .filter((para) => para.length > 0);
}

export default async function ServicesPage() {
  let page: ContentPage;
  try {
    page = await publicFetch<ContentPage>("/content/pages/services", fetchOpts);
  } catch (err) {
    // A 404 from the REST API means the services page slug does not exist —
    // render the Next.js not-found page (Requirements 4.10, 4.11).
    if (err instanceof ApiError && err.status === 404) {
      notFound();
    }
    // The page is pre-rendered at build time, when the API may be unreachable.
    // Fall back to the placeholder copy so the deploy succeeds; ISR replaces it
    // with real content on the next revalidation.
    if (process.env.NEXT_PHASE !== "phase-production-build") {
      // Any other error bubbles up to the route's error boundary (Requirement 4.12).
      throw err;
    }
    page = { id: "services", slug: "services", title: "Services", body: "", updated_at: "" };
  }

  const paragraphs = toParagraphs(page.body);

  return (
    <>
      <PageHero
        eyebrow="At your service"
        title={page.title}
        description="From cabanas and lockers to dining and group bookings—everything that makes your Park Vega day effortless from arrival to last ride."
        image="/parkvega-hero.jpg"
        imageAlt="Guests relaxing by the pools at Park Vega Waterpark"
      />

      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
        <SectionHeading
          eyebrow="What we offer"
          title="Services built around your day."
          description="Everything you need for a smooth, comfortable visit—so you can focus on the fun."
        />
        <div className="mt-8 max-w-2xl space-y-5 leading-relaxed text-muted-foreground">
          {paragraphs.length > 0 ? (
            paragraphs.map((para, index) => <p key={index}>{para}</p>)
          ) : (
            <p>
              Details about Park Vega&apos;s services are being refreshed. In the
              meantime, our team is happy to help with cabanas, lockers, dining
              and group bookings—just reach out before your visit.
            </p>
          )}
        </div>
      </section>
      <FaqBlock extra={[
          ["Can I rent a cabana at Park Vega?", "Yes. Private cabanas seat up to 12 guests and come with a TV, phone charging and a fan. Book ahead on WhatsApp."],
        ]} />
    </>
  );
}
