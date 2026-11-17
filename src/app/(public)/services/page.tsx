import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarClock,
  Car,
  Check,
  Droplets,
  HeartPulse,
  LifeBuoy,
  Lock,
  MessageCircle,
  QrCode,
  ShieldCheck,
  ShoppingBag,
  Ticket,
  Umbrella,
  UtensilsCrossed,
  Users,
  Waves,
  Wine,
  type LucideIcon,
} from "lucide-react";

import { EnquiryForm } from "@/components/parkvega/enquiry-form";
import { FaqBlock } from "@/components/parkvega/faq-block";
import { PackageCards } from "@/components/parkvega/package-cards";
import { PageHero, SectionHeading } from "@/components/parkvega/page-hero";
import { WhatsAppButton } from "@/components/parkvega/whatsapp-button";
import { Button } from "@/components/ui/button";
import { publicFetch } from "@/lib/api.server";
import { DEFAULT_HERO_PHOTOS } from "@/lib/site-photos";
import { getPageImages, publicFetchOpts, spotPhotos } from "@/lib/public-data";
import {
  CABANA_FEATURES,
  CORPORATE_PACKAGES,
  GROUP_OFFERS,
  JOURNEY,
  SERVICE_CATEGORIES,
  type ServiceItem,
  type ServiceTone,
} from "@/lib/services-content";
import { whatsappUrl } from "@/lib/site";
import { cn } from "@/lib/utils";
import type { ContentPage } from "@/types/api";

// ISR: regenerate the services page at most once every 60 seconds (Requirement 4.1).
export const revalidate = 60;

const TITLE = "Services | Park Vega Waterpark Agbor";
const DESCRIPTION =
  "Guest services at Park Vega Waterpark, Agbor: private cabanas, dining, lifeguards, life jackets, online tickets and corporate and group bookings.";

/** Staff-chosen `services/hero`, `services/cabanas` and `services/groups` photos; a spot left empty shows none. */
async function getPhotos() {
  const images = await getPageImages("services");
  const groupPhotos = spotPhotos(images, "groups");
  return {
    hero: spotPhotos(images, "hero")[0] ?? DEFAULT_HERO_PHOTOS.services,
    cabana: spotPhotos(images, "cabanas")[0] ?? null,
    groupOffers: GROUP_OFFERS.map((offer, index) => ({ ...offer, photo: groupPhotos[index] ?? null })),
  };
}

// Per Requirement 5.1, every page exports a `generateMetadata()` function
// returning a unique title (<= 60 chars) and description (<= 160 chars).
export async function generateMetadata(): Promise<Metadata> {
  const { hero } = await getPhotos();
  return {
    title: TITLE,
    description: DESCRIPTION,
    alternates: { canonical: "/services" },
    openGraph: { title: TITLE, description: DESCRIPTION, type: "website", images: hero ? [hero.src] : undefined },
    twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
  };
}

const CABANA_ENQUIRY = "Hi Park Vega! I'd like to book a private cabana.";
const CORPORATE_ENQUIRY = "Hi Park Vega! I'd like to plan a corporate or group day";

/** Icon for each service card, keyed by its title in services-content. */
const ICONS: Record<string, LucideIcon> = {
  "Private cabanas": Umbrella,
  "Changing rooms & showers": Droplets,
  Lockers: Lock,
  "On-site parking": Car,
  "Park Vega Restaurant": UtensilsCrossed,
  "Order ahead, skip the line": ShoppingBag,
  "Swim-up bar": Wine,
  "Group meal packages": Users,
  "Lifeguards on duty": ShieldCheck,
  "Free life jackets": LifeBuoy,
  "Ride guidance": Waves,
  "First aid": HeartPulse,
  "Online tickets": Ticket,
  "Plan My Day": CalendarClock,
  "My bookings": QrCode,
  "WhatsApp concierge": MessageCircle,
};

/** Icon tile colours per category; each pairs a soft brand fill with readable Deep Ocean or ink text. */
const TONES: Record<ServiceTone, string> = {
  ocean: "bg-ocean-soft text-primary-ink group-hover:bg-primary group-hover:text-primary-foreground",
  coral: "bg-coral/15 text-foreground group-hover:bg-coral",
  sun: "bg-accent/50 text-accent-foreground group-hover:bg-accent",
  leaf: "bg-secondary/20 text-foreground group-hover:bg-secondary",
};

const STATS = [
  { value: "15", label: "attractions, one ticket" },
  { value: "12", label: "guests per private cabana" },
  { value: "20+", label: "unlocks group pricing" },
  { value: "Free", label: "life jackets for non-swimmers" },
];

const SECTIONS = [
  ...SERVICE_CATEGORIES.map(({ id, label }) => ({ id, label })),
  { id: "cabanas", label: "Cabanas" },
  { id: "groups", label: "Groups & events" },
  { id: "corporate", label: "Corporate" },
];

const stagger = (i: number) => ({ "--i": i }) as CSSProperties;

/** Splits a CMS body into paragraphs (blank lines separate them), so no HTML is injected. */
function toParagraphs(body: string): string[] {
  return body
    .split(/\n\s*\n/)
    .map((para) => para.trim())
    .filter((para) => para.length > 0);
}

function ServiceLink({ item }: { item: ServiceItem }) {
  if (!item.href || !item.cta) return null;
  const className =
    "mt-5 inline-flex min-h-11 items-center gap-1.5 text-sm font-bold text-primary-ink underline-offset-4 hover:underline";
  if (item.href.startsWith("whatsapp:")) {
    return (
      <a href={whatsappUrl(item.href.slice("whatsapp:".length))} target="_blank" rel="noopener noreferrer" className={className}>
        {item.cta} <ArrowRight className="size-4" aria-hidden="true" />
      </a>
    );
  }
  return (
    <Link href={item.href} className={className}>
      {item.cta} <ArrowRight className="size-4" aria-hidden="true" />
    </Link>
  );
}

export default async function ServicesPage() {
  // Optional staff-written intro; the page is complete without it.
  const [page, { hero, cabana, groupOffers }] = await Promise.all([
    publicFetch<ContentPage>("/content/pages/services", publicFetchOpts).catch(() => null),
    getPhotos(),
  ]);
  const paragraphs = page?.body ? toParagraphs(page.body) : [];

  return (
    <>
      <PageHero
        eyebrow="Guest services"
        title="Everything taken care of, so you just play."
        description="Private cabanas, all-day dining, lifeguards on every pool and group hosting for parties, schools and companies. Here's how we look after you at Park Vega."
        image={hero?.src}
        imageAlt={hero?.alt}
      />

      {/* Headline numbers */}
      <section aria-label="Park Vega at a glance" className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
        <dl className="grid grid-cols-2 overflow-hidden rounded-3xl border border-border bg-card lg:grid-cols-4">
          {STATS.map(({ value, label }, i) => (
            <div
              key={label}
              data-reveal
              style={stagger(i)}
              className={cn("p-5 sm:p-7", i % 2 === 1 && "border-l border-border", i >= 2 && "border-t border-border lg:border-t-0", i === 2 && "lg:border-l")}
            >
              <dt className="sr-only">{label}</dt>
              <dd>
                <span className="block font-display text-3xl font-bold text-primary-ink sm:text-4xl">{value}</span>
                <span className="mt-1 block text-sm text-muted-foreground">{label}</span>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <nav aria-label="On this page" className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
        <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:px-0">
          {SECTIONS.map(({ id, label }) => (
            <li key={id} className="shrink-0">
              <a
                href={`#${id}`}
                className="block rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold hover:border-primary hover:text-primary-ink"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {paragraphs.length > 0 && (
        <section className="mx-auto max-w-3xl space-y-5 px-4 pt-12 leading-relaxed text-muted-foreground sm:px-6">
          {paragraphs.map((para, index) => (
            <p key={index}>{para}</p>
          ))}
        </section>
      )}

      {SERVICE_CATEGORIES.map((category, index) => (
        <div key={category.id}>
          <section
            id={category.id}
            className={cn("scroll-mt-24 py-16 sm:py-20", index % 2 === 1 && "bg-ocean-soft/50")}
          >
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
              <SectionHeading eyebrow={category.eyebrow} title={category.title} description={category.description} />
              <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {category.items.map((item, i) => {
                  const Icon = ICONS[item.title] ?? Check;
                  return (
                    <article
                      key={item.title}
                      data-reveal
                      style={stagger(i)}
                      className="card-lift group flex flex-col rounded-3xl border border-border bg-card p-6 hover:border-primary/50"
                    >
                      <span
                        className={cn(
                          "grid size-12 place-items-center rounded-2xl transition-[rotate,scale,background-color,color] duration-300 group-hover:-rotate-6 group-hover:scale-110",
                          TONES[category.tone],
                        )}
                      >
                        <Icon className="size-6" aria-hidden="true" />
                      </span>
                      <h3 className="mt-5 text-lg font-semibold">{item.title}</h3>
                      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
                      <ServiceLink item={item} />
                    </article>
                  );
                })}
              </div>
            </div>
          </section>

          {/* The premium service gets its own showcase straight after the comfort basics. */}
          {category.id === "comfort" && (
            <section id="cabanas" className="scroll-mt-24 px-3 sm:px-6">
              <div className={cn("mx-auto grid max-w-7xl overflow-hidden rounded-3xl bg-deep text-hero-foreground", cabana && "lg:grid-cols-2")}>
                {cabana && (
                  <div className="relative min-h-72 lg:min-h-full">
                    <Image
                      src={cabana.src}
                      alt={cabana.alt}
                      fill
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="object-cover"
                    />
                    <span className="absolute left-5 top-5 rounded-full bg-accent px-3 py-1 text-[11px] font-extrabold uppercase text-accent-foreground">
                      Premium
                    </span>
                  </div>
                )}
                <div className="p-6 py-10 sm:p-12">
                  <span className="text-xs font-extrabold uppercase text-secondary">Private cabanas</span>
                  <h2 className="mt-3 text-balance text-[1.75rem] font-bold leading-tight sm:text-4xl">
                    Your own shaded base for the day.
                  </h2>
                  <p className="mt-4 max-w-md leading-relaxed text-hero-foreground/75">
                    Drop your bags, plug in your phones and come back between rides. Perfect for families, birthdays and
                    groups who want somewhere of their own.
                  </p>
                  <ul className="mt-7 grid gap-3 sm:grid-cols-2">
                    {CABANA_FEATURES.map((feature, i) => (
                      <li key={feature} data-reveal style={stagger(i)} className="flex items-start gap-2.5 text-sm">
                        <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-secondary text-secondary-foreground">
                          <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />
                        </span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-8 flex flex-wrap gap-3">
                    <WhatsAppButton size="lg" message={CABANA_ENQUIRY}>
                      Reserve a cabana
                    </WhatsAppButton>
                    <Button asChild variant="glass" size="lg">
                      <Link href="/birthday-parties">Cabana parties</Link>
                    </Button>
                  </div>
                  <p className="mt-4 text-xs text-hero-foreground/60">Cabanas are limited each day, so book ahead.</p>
                </div>
              </div>
            </section>
          )}
        </div>
      ))}

      {/* How the services fit together across a visit */}
      <section className="bg-deep py-16 text-hero-foreground sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <span className="text-xs font-extrabold uppercase text-secondary">Your day, start to finish</span>
          <h2 className="mt-3 max-w-3xl text-balance text-[1.75rem] font-bold leading-tight sm:text-4xl">
            Looked after from the first click to the last slide.
          </h2>
          <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {JOURNEY.map(({ step, title, text }, i) => (
              <li
                key={step}
                data-reveal
                style={stagger(i)}
                className="relative rounded-3xl border border-hero-foreground/15 bg-hero-foreground/5 p-6"
              >
                <span className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-full bg-primary font-display text-lg font-bold text-primary-foreground">
                    {i + 1}
                  </span>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-secondary">{step}</span>
                </span>
                <h3 className="mt-5 text-xl font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-hero-foreground/70">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="groups" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-16 sm:px-6 sm:py-20">
        <SectionHeading
          eyebrow="Groups & events"
          title="Bring the whole crew."
          description="Parties, school trips and company days, each with its own team to plan it with you."
        />
        <div className="mt-9 grid gap-5 md:grid-cols-3">
          {groupOffers.map((offer) => (
            <Link
              key={offer.title}
              href={offer.href}
              data-reveal
              className="card-lift group overflow-hidden rounded-3xl border border-border bg-card hover:border-primary/50"
            >
              {offer.photo && (
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image
                    src={offer.photo.src}
                    alt={offer.photo.alt}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover"
                  />
                </div>
              )}
              <div className="p-6">
                <h3 className="text-xl font-semibold transition-colors group-hover:text-primary-ink">{offer.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{offer.text}</p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-primary-ink">
                  {offer.cta}
                  <ArrowRight className="size-4 transition-[translate] duration-300 group-hover:translate-x-1" aria-hidden="true" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section id="corporate" className="scroll-mt-24 bg-ocean-soft/50 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <SectionHeading
              eyebrow="Corporate & group bookings"
              title="Team days your staff will actually look forward to."
              description="Staff fun days, end-of-year parties, client hosting and church outings for groups of 20 and above. Tell us your date and headcount and we'll send a quote."
            />
            <span data-reveal className="flex w-fit shrink-0 items-center gap-2 rounded-full bg-card px-4 py-2 text-sm font-semibold">
              <BriefcaseBusiness className="size-4 text-primary-ink" aria-hidden="true" /> Group pricing from 20 guests
            </span>
          </div>
          <div className="mt-9">
            <PackageCards packages={CORPORATE_PACKAGES} enquiry={CORPORATE_ENQUIRY} />
          </div>
        </div>
      </section>

      <section id="book" className="scroll-mt-24 bg-deep py-16 text-hero-foreground">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <span className="text-xs font-extrabold uppercase text-secondary">Book a group day</span>
            <h2 className="mt-3 text-[1.75rem] font-bold leading-tight sm:text-4xl">Tell us about your group.</h2>
            <p className="mt-4 text-hero-foreground/75">
              Send your details and our team will confirm availability, cabanas and pricing on WhatsApp. Prefer to chat
              now?
            </p>
            <WhatsAppButton className="mt-6" size="lg" message={CORPORATE_ENQUIRY}>
              Chat on WhatsApp
            </WhatsAppButton>
          </div>
          <div className="text-foreground">
            <EnquiryForm
              type="corporate"
              title="Corporate & group enquiry"
              submitLabel="Request a group quote"
              fields={[
                { name: "name", label: "Your name", required: true },
                { name: "organisation", label: "Company or organisation", required: true },
                { name: "whatsapp", label: "WhatsApp number", type: "tel", required: true, placeholder: "0802 444 0445" },
                { name: "email", label: "Email", type: "email" },
                { name: "date", label: "Preferred date", type: "date", required: true, hint: "We're open Thu – Sun & public holidays" },
                { name: "guests", label: "Number of guests", type: "number", required: true, min: 20 },
                { name: "package", label: "Package", type: "select", required: true, options: [...CORPORATE_PACKAGES.map((p) => p.name), "Not sure yet"] },
                { name: "notes", label: "Anything else?", type: "textarea", placeholder: "Meals, cabanas, branding, arrival time…" },
              ]}
            />
          </div>
        </div>
      </section>

      <FaqBlock
        title="Questions about our services."
        page="services"
      />
    </>
  );
}
