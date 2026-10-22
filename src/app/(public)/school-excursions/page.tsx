import type { Metadata } from "next";
import { ClipboardCheck, Printer, ShieldCheck } from "lucide-react";

import { EnquiryForm } from "@/components/parkvega/enquiry-form";
import { FaqBlock } from "@/components/parkvega/faq-block";
import { PackageCards } from "@/components/parkvega/package-cards";
import { PageHero, SectionHeading } from "@/components/parkvega/page-hero";
import { WhatsAppButton } from "@/components/parkvega/whatsapp-button";
import { SCHOOL_PRICING, SCHOOL_SAFETY, TEACHER_CHECKLIST } from "@/lib/visit-content";

// ISR: regenerate at most once every 60 seconds (Requirement 4.1).
export const revalidate = 60;

const TITLE = "School Excursions & Group Trips | Park Vega Waterpark";
const DESCRIPTION =
  "Plan a safe, fun school excursion to Park Vega Waterpark in Agbor: group pricing for 20+, lifeguards, kids' pools and a teacher checklist. Book on WhatsApp.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/school-excursions" },
  openGraph: { title: TITLE, description: DESCRIPTION, type: "website", images: ["/splash-pad.jpg"] },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

const ENQUIRY = "Hi Park Vega! I'd like to book a school excursion";

export default function SchoolExcursionsPage() {
  return (
    <>
      <PageHero
        eyebrow="School excursions & groups"
        title="A fun, safe day out for pupils."
        description="Zero-depth kids' pools, anti-slip floors, lifeguards and life jackets for non-swimmers, with group pricing for schools, churches and corporates of 20+."
        image="/splash-pad.jpg"
        imageAlt="Pupils playing safely in the Park Vega kids' splash zone"
      />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <SectionHeading
          eyebrow="Group pricing"
          title="Pricing for groups of 20 and above."
          description="Rates depend on your date and group size. Send your numbers and we'll reply with a quote on WhatsApp."
        />
        <div className="mt-9">
          <PackageCards packages={SCHOOL_PRICING} enquiry={ENQUIRY} />
        </div>
      </section>

      <section className="bg-ocean-soft/50 py-16">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-border bg-card p-6 sm:p-8">
            <ShieldCheck className="size-8 text-primary-ink" />
            <h2 className="mt-4 text-2xl font-semibold sm:text-3xl">Safety information</h2>
            <ul className="mt-5 grid gap-3 text-sm">
              {SCHOOL_SAFETY.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary-ink" /> {item}
                </li>
              ))}
            </ul>
          </div>
          <div id="teachers" className="scroll-mt-24 rounded-3xl border border-border bg-card p-6 sm:p-8">
            <ClipboardCheck className="size-8 text-primary-ink" />
            <h2 className="mt-4 text-2xl font-semibold sm:text-3xl">Teacher resources</h2>
            <p className="mt-2 text-sm text-muted-foreground">Your pre-trip checklist:</p>
            <ul className="mt-5 grid gap-3 text-sm">
              {TEACHER_CHECKLIST.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-0.5 size-5 shrink-0 rounded border-2 border-primary" aria-hidden="true" /> {item}
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <WhatsAppButton variant="outline" message={`${ENQUIRY}. Please send a parent consent form template.`}>
                Request consent form
              </WhatsAppButton>
              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                <Printer className="size-4" /> Print this page to use as your checklist
              </span>
            </div>
          </div>
        </div>
      </section>

      <section id="book" className="scroll-mt-24 bg-deep py-16 text-hero-foreground">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <span className="text-xs font-extrabold uppercase text-secondary">Book a school trip</span>
            <h2 className="mt-3 text-[1.75rem] font-bold leading-tight sm:text-4xl">Tell us about your group.</h2>
            <p className="mt-4 text-hero-foreground/75">
              Send your details and our team will confirm the date and group price on WhatsApp.
            </p>
            <WhatsAppButton className="mt-6" size="lg" message={ENQUIRY}>
              Chat on WhatsApp
            </WhatsAppButton>
          </div>
          <div className="text-foreground">
            <EnquiryForm
              type="school"
              title="School excursion enquiry"
              submitLabel="Request group pricing"
              fields={[
                { name: "organisation", label: "School / organisation", required: true },
                { name: "name", label: "Contact person", required: true },
                { name: "whatsapp", label: "WhatsApp number", type: "tel", required: true, placeholder: "0802 444 0445" },
                { name: "email", label: "Email", type: "email" },
                { name: "date", label: "Preferred date", type: "date", required: true, hint: "We're open Thu – Sun & public holidays" },
                { name: "pupils", label: "Number of pupils", type: "number", required: true, min: 1 },
                { name: "staff", label: "Number of teachers / staff", type: "number", required: true, min: 1 },
                { name: "notes", label: "Anything else?", type: "textarea", placeholder: "Age range, meal add-on, non-swimmers, medical needs…" },
              ]}
            />
          </div>
        </div>
      </section>

      <FaqBlock
        title="School trip questions."
        limit={7}
        extra={[
          [
            "Does Park Vega give group discounts for schools?",
            "Yes. Schools, churches, corporates and any group above 20 get group pricing. Send your group size and date and we'll reply with a quote.",
          ],
          [
            "Is Park Vega safe for school children?",
            "Yes. There are lifeguards on duty, zero-depth kids' pools, anti-slip floors, life jackets for non-swimmers and staff guidance at every slide.",
          ],
          [
            "How many teachers should come on a school trip?",
            "We recommend at least one supervising adult for every 10 pupils, and children under 150cm must be with an adult.",
          ],
        ]}
      />
    </>
  );
}
