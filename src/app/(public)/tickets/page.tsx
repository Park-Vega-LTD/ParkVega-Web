import type { Metadata } from "next";
import { Suspense } from "react";
import { Users } from "lucide-react";

import { BookingFunnel } from "@/components/parkvega/booking-funnel";
import { EnquiryForm } from "@/components/parkvega/enquiry-form";
import { FaqBlock } from "@/components/parkvega/faq-block";
import { PackageCards } from "@/components/parkvega/package-cards";
import { SectionHeading } from "@/components/parkvega/page-hero";
import { WhatsAppButton } from "@/components/parkvega/whatsapp-button";
import { getExtraOpenDates } from "@/lib/public-data";
import { GROUP_PACKAGES } from "@/lib/visit-content";

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

const GROUP_ENQUIRY = "Hi Park Vega! I'd like to book a group visit";

export default async function TicketsPage() {
  const extraOpenDates = await getExtraOpenDates();

  return (
    <>
      {/* ── Individual ticket booking funnel ─────────────────────────── */}
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

      {/* ── Group admission ──────────────────────────────────────────── */}
      <section
        id="groups"
        className="scroll-mt-24 border-t border-border bg-muted/40 py-16"
        aria-labelledby="groups-heading"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading
            eyebrow="Group admission"
            title="Bringing a crowd? We've got you."
            description="Special rates for groups of 20 and above — schools, churches, corporates, birthday squads and community outings. Prices vary by date and size; send your details and we'll reply with a quote on WhatsApp."
          />

          {/* Package overview cards */}
          <div className="mt-10">
            <PackageCards packages={GROUP_PACKAGES} enquiry={GROUP_ENQUIRY} />
          </div>

          {/* Supporting benefits strip */}
          <ul className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: <Users className="size-5 text-primary-ink" aria-hidden="true" />,
                heading: "Flexible group sizes",
                body: "Whether you're 20 or 200, we'll plan the right setup for your group.",
              },
              {
                icon: (
                  <svg viewBox="0 0 20 20" fill="currentColor" className="size-5 text-primary-ink" aria-hidden="true">
                    <path d="M2 3a1 1 0 0 1 1-1h2.153a1 1 0 0 1 .986.836l.74 4.435a1 1 0 0 1-.54 1.06l-1.548.773a11.037 11.037 0 0 0 6.105 6.105l.774-1.548a1 1 0 0 1 1.059-.54l4.435.74a1 1 0 0 1 .836.986V17a1 1 0 0 1-1 1h-2C7.82 18 2 12.18 2 5V3Z" />
                  </svg>
                ),
                heading: "WhatsApp coordination",
                body: "A dedicated contact handles your booking from first quote to gate entry.",
              },
              {
                icon: (
                  <svg viewBox="0 0 20 20" fill="currentColor" className="size-5 text-primary-ink" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.403 12.652a3 3 0 0 0 0-5.304 3 3 0 0 0-3.75-3.751 3 3 0 0 0-5.305 0 3 3 0 0 0-3.751 3.75 3 3 0 0 0 0 5.305 3 3 0 0 0 3.75 3.751 3 3 0 0 0 5.305 0 3 3 0 0 0 3.751-3.75Zm-2.546-4.46a.75.75 0 0 0-1.214-.883l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
                  </svg>
                ),
                heading: "Food & cabanas included",
                body: "Add pre-ordered meals and private cabanas when you request your quote.",
              },
            ].map(({ icon, heading, body }) => (
              <li key={heading} className="flex gap-3 rounded-2xl border border-border bg-card p-5">
                <span className="mt-0.5 shrink-0">{icon}</span>
                <div>
                  <p className="font-semibold">{heading}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Group enquiry form ───────────────────────────────────────── */}
      <section className="bg-deep py-16 text-hero-foreground">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <span className="text-xs font-extrabold uppercase text-secondary">
              Book a group visit
            </span>
            <h2 className="mt-3 text-[1.75rem] font-bold leading-tight sm:text-4xl">
              Tell us about your group.
            </h2>
            <p className="mt-4 text-hero-foreground/75">
              Fill in the form and our team will confirm availability and send
              a group rate quote on WhatsApp — usually within a few hours.
            </p>
            <WhatsAppButton className="mt-6" size="lg" message={GROUP_ENQUIRY}>
              Chat on WhatsApp
            </WhatsAppButton>
          </div>
          <div className="text-foreground">
            <EnquiryForm
              type="corporate"
              title="Group admission enquiry"
              submitLabel="Request group pricing"
              fields={[
                {
                  name: "organisation",
                  label: "Organisation / group name",
                  required: true,
                  placeholder: "e.g. St. Mary's Church, Acme Corp",
                },
                {
                  name: "name",
                  label: "Contact person",
                  required: true,
                },
                {
                  name: "whatsapp",
                  label: "WhatsApp number",
                  type: "tel",
                  required: true,
                  placeholder: "0802 444 0445",
                },
                {
                  name: "email",
                  label: "Email",
                  type: "email",
                },
                {
                  name: "date",
                  label: "Preferred visit date",
                  type: "date",
                  required: true,
                  hint: "We're open Thu – Sun & public holidays",
                },
                {
                  name: "group_size",
                  label: "Estimated group size",
                  type: "number",
                  required: true,
                  min: 20,
                  hint: "Minimum 20 people for group rates",
                },
                {
                  name: "group_type",
                  label: "Type of group",
                  type: "select",
                  required: true,
                  options: [
                    "School / college",
                    "Church / religious",
                    "Corporate / staff",
                    "Birthday / celebration",
                    "Community / NGO",
                    "Other",
                  ],
                },
                {
                  name: "notes",
                  label: "Anything else?",
                  type: "textarea",
                  placeholder:
                    "Meal add-on, cabana, non-swimmers, age range, special needs…",
                },
              ]}
            />
          </div>
        </div>
      </section>

      <FaqBlock page="tickets" />
    </>
  );
}
