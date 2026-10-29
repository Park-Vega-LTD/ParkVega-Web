import Image from "next/image";
import type { Metadata } from "next";
import { Cake, Ticket, Umbrella, UtensilsCrossed } from "lucide-react";

import { EnquiryForm } from "@/components/parkvega/enquiry-form";
import { FaqBlock } from "@/components/parkvega/faq-block";
import { PackageCards } from "@/components/parkvega/package-cards";
import { PageHero, SectionHeading } from "@/components/parkvega/page-hero";
import { ReviewsGrid } from "@/components/parkvega/reviews-grid";
import { WhatsAppButton } from "@/components/parkvega/whatsapp-button";
import { BIRTHDAY_PACKAGES } from "@/lib/visit-content";

// ISR: regenerate at most once every 60 seconds (Requirement 4.1).
export const revalidate = 60;

const TITLE = "Birthday Parties at Park Vega Waterpark, Agbor";
const DESCRIPTION =
  "Host a birthday party at Park Vega Waterpark in Agbor: private cabanas for 12, food & drinks, group tickets and unlimited rides. Book on WhatsApp.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/birthday-parties" },
  openGraph: { title: TITLE, description: DESCRIPTION, type: "website", images: ["/splash-pad.jpg"] },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

const ENQUIRY = "Hi Park Vega! I'd like to plan a birthday party";

const INCLUDED = [
  { icon: Ticket, title: "Tickets for everyone", text: "Unlimited rides on every attraction for the whole party." },
  { icon: Umbrella, title: "Private cabana", text: "A shaded base for up to 12 guests with TV, phone charging and a fan." },
  { icon: UtensilsCrossed, title: "Food & drinks", text: "Jollof, pizza, wings, burgers and cold drinks from Park Vega Restaurant." },
  { icon: Cake, title: "Planned with you", text: "Our team plans the details with you on WhatsApp before the big day." },
];

const PHOTOS = [
  { src: "/splash-pad.jpg", alt: "Children playing in the Park Vega splash zone" },
  { src: "/photos/wave-pool-tubes.jpg", alt: "Friends cheering from rubber rings in the Park Vega wave pool" },
  { src: "/park-food.jpg", alt: "Party food from Park Vega Restaurant" },
  { src: "/photos/racing-slide-friends.jpg", alt: "Two friends laughing as they splash down the racing slide" },
];

export default function BirthdayPartiesPage() {
  return (
    <>
      <PageHero
        eyebrow="Birthday parties"
        title="Turn a birthday into a splash day."
        description="Book a private cabana, add food and drinks, and let the party loose on every slide. We'll plan it all with you on WhatsApp."
        image="/splash-pad.jpg"
        imageAlt="Children celebrating in the Park Vega splash zone"
      />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <SectionHeading eyebrow="What's included" title="Everything for a party they'll talk about." />
        <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {INCLUDED.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-3xl border border-border bg-card p-6">
              <span className="grid size-12 place-items-center rounded-2xl bg-accent text-accent-foreground">
                <Icon className="size-6" />
              </span>
              <h3 className="mt-5 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-ocean-soft/50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading
            eyebrow="Packages & pricing"
            title="Pick your party."
            description="Prices depend on your date and group size. Tell us what you need and we'll send a quote on WhatsApp."
          />
          <div className="mt-9">
            <PackageCards packages={BIRTHDAY_PACKAGES} enquiry={ENQUIRY} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6" aria-label="Party photos">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {PHOTOS.map(({ src, alt }) => (
            <div key={src} className="relative aspect-square overflow-hidden rounded-3xl">
              <Image src={src} alt={alt} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover" />
            </div>
          ))}
        </div>
      </section>

      <section id="book" className="scroll-mt-24 bg-deep py-16 text-hero-foreground">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <span className="text-xs font-extrabold uppercase text-secondary">Book a party</span>
            <h2 className="mt-3 text-[1.75rem] font-bold leading-tight sm:text-4xl">Tell us about the birthday.</h2>
            <p className="mt-4 text-hero-foreground/75">
              Send your details and our team will confirm availability and pricing on WhatsApp. Prefer to chat now?
            </p>
            <WhatsAppButton className="mt-6" size="lg" message={ENQUIRY}>
              Chat on WhatsApp
            </WhatsAppButton>
          </div>
          <div className="text-foreground">
            <EnquiryForm
              type="birthday"
              title="Birthday party enquiry"
              submitLabel="Request a party quote"
              fields={[
                { name: "name", label: "Your name", required: true },
                { name: "whatsapp", label: "WhatsApp number", type: "tel", required: true, placeholder: "0802 444 0445" },
                { name: "email", label: "Email", type: "email" },
                { name: "date", label: "Party date", type: "date", required: true, hint: "We're open Thu – Sun & public holidays" },
                { name: "guests", label: "Number of guests", type: "number", required: true, min: 1 },
                { name: "package", label: "Package", type: "select", required: true, options: [...BIRTHDAY_PACKAGES.map((p) => p.name), "Not sure yet"] },
                { name: "notes", label: "Anything else?", type: "textarea", placeholder: "Birthday person's age, food preferences, special requests…" },
              ]}
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <SectionHeading eyebrow="Google reviews" title="Families love a Park Vega day." />
        <div className="mt-9">
          <ReviewsGrid />
        </div>
      </section>

      <FaqBlock
        title="Birthday party questions."
        limit={7}
        extra={[
          [
            "How much is a birthday party at Park Vega?",
            "It depends on your date, number of guests and whether you add a cabana or food. Send your details on this page or on WhatsApp and we'll send a quote.",
          ],
          [
            "How many guests fit in a Park Vega cabana?",
            "A private cabana seats up to 12 guests and has a TV, phone charging and a fan. Bigger groups can book more than one cabana or a group package.",
          ],
          [
            "Can we bring a birthday cake to Park Vega?",
            "Outside food is not normally allowed, so ask our team on WhatsApp about cakes when you book your party.",
          ],
        ]}
      />
    </>
  );
}
