import type { Metadata } from "next";
import { Suspense } from "react";

import { BookingFunnel } from "@/components/parkvega/booking-funnel";
import { getExtraOpenDates } from "@/lib/public-data";
import { FaqBlock } from "@/components/parkvega/faq-block";

// ISR: the FAQ block reads staff-managed FAQs, refreshed at most every 60 seconds.
export const revalidate = 60;

// Static metadata for the tickets funnel page (Requirements 6.1, 5.1).
export const metadata: Metadata = {
  // Title: 41 chars (<= 60)
  title: "Buy Tickets | Park Vega Waterpark Agbor",
  // Description: 148 chars (<= 160)
  description:
    "Book your Park Vega Waterpark visit in Agbor. Pick a date, choose your tickets, and pay securely online to lock in your splash day before you arrive.",
  openGraph: {
    title: "Buy Tickets | Park Vega Waterpark Agbor",
    description:
      "Pick a date, choose your tickets, and pay securely online to secure your Park Vega visit.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Buy Tickets | Park Vega Waterpark Agbor",
    description:
      "Pick a date, choose your tickets, and pay securely online to secure your Park Vega visit.",
  },
};

export default async function TicketsPage() {
  const extraOpenDates = await getExtraOpenDates();

  return (
    <>
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="mb-10 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary-ink">
            Make a splash
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Book your Park Vega tickets
          </h1>
        </div>

        <Suspense
          fallback={
            <p className="text-center text-sm text-muted-foreground">
              Loading booking…
            </p>
          }
        >
          <BookingFunnel extraOpenDates={extraOpenDates} />
        </Suspense>
      </section>
      <FaqBlock extra={[
          ["When can I use my Park Vega ticket?", "Tickets are valid on Thursdays, Fridays, Saturdays, Sundays and public holidays, from 11am to 6pm."],
          ["Do children pay at Park Vega?", "Kids between 90cm and 150cm pay the child rate, and children under 90cm get in free."],
        ]} />
    </>
  );
}
