import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  BedDouble,
  Check,
  Clock3,
  MapPin,
  Navigation,
  Shirt,
  Ticket,
  UtensilsCrossed,
  X,
} from "lucide-react";

import { FaqBlock } from "@/components/parkvega/faq-block";
import { JsonLd } from "@/components/parkvega/json-ld";
import { PageHero, SectionHeading } from "@/components/parkvega/page-hero";
import { ParkRulesList, ProhibitedItemsGrid } from "@/components/parkvega/park-rules";
import { WhatsAppButton } from "@/components/parkvega/whatsapp-button";
import { Button } from "@/components/ui/button";
import { publicFetch } from "@/lib/api.server";
import { getFromPrice, getTicketProducts, publicFetchOpts } from "@/lib/public-data";
import { waterParkSchema } from "@/lib/schema";
import {
  ADDRESS,
  MAPS_URL,
  OPEN_DAYS_LONG,
  OPEN_HOURS,
  formatNaira,
  whatsappUrl,
} from "@/lib/site";
import {
  ACCOMMODATION,
  ADD_ONS,
  CITY_DIRECTIONS,
  FOOD_POLICY,
  WHAT_TO_EXPECT,
  WHAT_TO_WEAR,
} from "@/lib/visit-content";
import type { ContentPage, PricingTier, TicketProduct } from "@/types/api";

// ISR: regenerate the plan-your-visit page at most once every 60 seconds (Requirement 4.1).
export const revalidate = 60;

const TITLE = "Plan Your Visit | Park Vega Waterpark Prices, Hours & Rules";
const DESCRIPTION =
  "Park Vega ticket prices, opening hours, what to wear, food policy, safety rules, add-ons and directions to Agbor, Delta State. Everything before you go.";

// Per Requirement 5.1, every page exports a `generateMetadata()` function
// returning a unique title (<= 60 chars) and description (<= 160 chars).
export function generateMetadata(): Metadata {
  return {
    title: TITLE,
    description: DESCRIPTION,
    alternates: { canonical: "/plan-your-visit" },
    openGraph: { title: TITLE, description: DESCRIPTION, type: "website" },
    twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
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

const CATEGORY_LABEL: Record<PricingTier["category"], string> = {
  ADULT: "Adults & kids over 150cm",
  CHILD: "Kids 90cm – 150cm",
  INFANT: "Kids under 90cm",
};

type PriceRow = { who: string; price: string };

/** Today's prices per category for each active ticket product. */
function productPriceRows(products: TicketProduct[], today: string) {
  return products
    .filter((product) => product.active)
    .map((product) => ({
      product,
      rows: (["ADULT", "CHILD", "INFANT"] as const).flatMap((category): PriceRow[] => {
        const tier = product.pricing_tiers.find(
          (t) =>
            t.category === category &&
            t.valid_from <= today &&
            (!t.valid_to || t.valid_to >= today),
        );
        if (!tier) return [];
        return [{ who: CATEGORY_LABEL[category], price: tier.price > 0 ? formatNaira(tier.price) : "Free" }];
      }),
    }))
    .filter(({ rows }) => rows.length > 0);
}

const SECTIONS = [
  { id: "prices", label: "Ticket prices" },
  { id: "wear", label: "What to wear" },
  { id: "food", label: "Food & drink" },
  { id: "safety", label: "Park rules" },
  { id: "prohibited", label: "Prohibited items" },
  { id: "expect", label: "What to expect" },
  { id: "add-ons", label: "Add-ons" },
  { id: "directions", label: "Directions" },
  { id: "stay", label: "Accommodation" },
];

export default async function PlanYourVisitPage() {
  const today = new Date().toISOString().slice(0, 10);

  // Fetch CMS content and ticket products in parallel. A single failure
  // degrades gracefully so the page still renders.
  const [page, products, fromPrice] = await Promise.all([
    publicFetch<ContentPage>("/content/pages/plan-your-visit", publicFetchOpts).catch(
      () => null,
    ),
    getTicketProducts(),
    getFromPrice(),
  ]);

  const paragraphs = page?.body ? toParagraphs(page.body) : [];
  const priced = productPriceRows(products, today);
  const fallbackRows: PriceRow[] = [
    { who: CATEGORY_LABEL.ADULT, price: `From ${formatNaira(fromPrice)}` },
    { who: CATEGORY_LABEL.CHILD, price: "Child rate" },
    { who: CATEGORY_LABEL.INFANT, price: "Free" },
  ];

  return (
    <>
      <JsonLd data={waterParkSchema(fromPrice)} />

      <PageHero
        eyebrow="Before you set out"
        title={page?.title ?? "Plan your visit to Park Vega."}
        description={`Tickets from ${formatNaira(fromPrice)}. Open ${OPEN_DAYS_LONG}, ${OPEN_HOURS}. Here's everything you need for a smooth splash day.`}
        image="/photos/slide-tower-tubes.jpg"
        imageAlt="Smiling guests in yellow double tubes in front of the Park Vega slide tower"
      />

      <nav aria-label="On this page" className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
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

      {/* Full price list + choose ticket type */}
      <section id="prices" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-16 sm:px-6">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <SectionHeading
            eyebrow="Choose your ticket"
            title="Full price list."
            description="One ticket covers unlimited rides on every attraction for the day. Tickets are valid on Thursdays, Fridays, Saturdays, Sundays and public holidays."
          />
          <Button asChild variant="ticket" size="lg">
            <Link href="/tickets">
              <Ticket className="size-5" /> Buy Tickets
            </Link>
          </Button>
        </div>
        <div className="mt-9 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {(priced.length > 0
            ? priced.map(({ product, rows }) => ({ name: product.name, description: product.description, rows }))
            : [{ name: "Day ticket", description: "Unlimited rides, 11am – 6pm", rows: fallbackRows }]
          ).map(({ name, description, rows }) => (
            <article key={name} className="overflow-hidden rounded-3xl border border-border bg-card">
              <div className="bg-deep px-5 py-4 text-hero-foreground">
                <h3 className="text-lg font-semibold">{name}</h3>
                {description && <p className="text-sm text-hero-foreground/70">{description}</p>}
              </div>
              <table className="w-full text-sm">
                <tbody>
                  {rows.map(({ who, price }) => (
                    <tr key={who} className="border-t border-border first:border-t-0">
                      <th scope="row" className="px-5 py-3 text-left font-semibold">{who}</th>
                      <td className="px-5 py-3 text-right font-display font-bold text-primary-ink">{price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="border-t border-border p-4">
                <Button asChild variant="ticket" className="w-full">
                  <Link href="/tickets">Choose this ticket</Link>
                </Button>
              </div>
            </article>
          ))}
        </div>
        <p className="mt-5 text-sm text-muted-foreground">
          Schools, corporates and groups above 20 get group pricing –{" "}
          <Link href="/school-excursions" className="font-semibold text-foreground underline underline-offset-2">
            see group options
          </Link>
          .
        </p>
      </section>

      {/* What to wear + food policy */}
      <section className="bg-ocean-soft/50 py-16">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-2">
          <div id="wear" className="scroll-mt-24 rounded-3xl border border-border bg-card p-6 sm:p-8">
            <Shirt className="size-8 text-primary-ink" />
            <h2 className="mt-4 text-2xl font-semibold sm:text-3xl">What to wear</h2>
            <ul className="mt-5 grid gap-3 text-sm">
              {WHAT_TO_WEAR.wear.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <Check className="mt-0.5 size-5 shrink-0 text-primary-ink" /> {item}
                </li>
              ))}
              {WHAT_TO_WEAR.avoid.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <X className="mt-0.5 size-5 shrink-0 text-destructive" /> {item}
                </li>
              ))}
            </ul>
          </div>
          <div id="food" className="scroll-mt-24 rounded-3xl border border-border bg-card p-6 sm:p-8">
            <UtensilsCrossed className="size-8 text-primary-ink" />
            <h2 className="mt-4 text-2xl font-semibold sm:text-3xl">Food & drink policy</h2>
            <ul className="mt-5 grid gap-3 text-sm">
              {FOOD_POLICY.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <Check className="mt-0.5 size-5 shrink-0 text-primary-ink" /> {item}
                </li>
              ))}
            </ul>
            <Button asChild variant="outline" className="mt-6">
              <Link href="/restaurants">
                See the menu <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Safety rules */}
      <section id="safety" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-16 sm:px-6">
        <SectionHeading eyebrow="Park rules" title="Fun is better when everyone is safe." />
        <ParkRulesList className="mt-9 lg:grid-cols-3" />
      </section>

      <section id="prohibited" className="scroll-mt-24 bg-muted py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading eyebrow="Prohibited items" title="Please leave these at home." />
          <ProhibitedItemsGrid className="mt-6" />
        </div>
      </section>

      {/* What to expect */}
      <section id="expect" className="scroll-mt-24 bg-deep py-16 text-hero-foreground">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <span className="text-xs font-extrabold uppercase text-secondary">What to expect</span>
          <h2 className="mt-3 text-[1.75rem] font-bold leading-tight sm:text-4xl">Your day at Park Vega.</h2>
          <ol className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {WHAT_TO_EXPECT.map(({ title, text }, index) => (
              <li key={title} className="rounded-3xl border border-hero-foreground/15 bg-hero-foreground/5 p-6">
                <span className="grid size-10 place-items-center rounded-full bg-secondary font-display font-bold text-secondary-foreground">
                  {index + 1}
                </span>
                <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-hero-foreground/75">{text}</p>
              </li>
            ))}
          </ol>
          <p className="mt-8 flex items-center gap-2 text-sm text-hero-foreground/80">
            <Clock3 className="size-4 text-secondary" /> Open {OPEN_DAYS_LONG}, {OPEN_HOURS}
          </p>
        </div>
      </section>

      {/* Add-ons */}
      <section id="add-ons" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-16 sm:px-6">
        <SectionHeading eyebrow="Make it extra" title="Add-ons for your visit." />
        <div className="mt-9 grid gap-5 md:grid-cols-3">
          {ADD_ONS.map(({ name, text, href, cta }) => {
            const isWhatsApp = href.startsWith("whatsapp:");
            return (
              <article key={name} className="flex flex-col rounded-3xl border border-border bg-card p-6">
                <h3 className="text-xl font-semibold">{name}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{text}</p>
                <div className="mt-6">
                  {isWhatsApp ? (
                    <WhatsAppButton message={href.slice("whatsapp:".length)}>{cta}</WhatsAppButton>
                  ) : (
                    <Button asChild variant="outline">
                      <Link href={href}>
                        {cta} <ArrowRight className="size-4" />
                      </Link>
                    </Button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Directions + accommodation */}
      <section className="bg-ocean-soft/50 py-16">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-[1.4fr_1fr]">
          <div id="directions" className="scroll-mt-24 rounded-3xl border border-border bg-card p-6 sm:p-8">
            <MapPin className="size-8 text-primary-ink" />
            <h2 className="mt-4 text-2xl font-semibold sm:text-3xl">Get directions</h2>
            <p className="mt-3 text-sm text-muted-foreground">{ADDRESS}</p>
            <ul className="mt-5 grid gap-2 sm:grid-cols-2">
              {CITY_DIRECTIONS.map(({ slug, city, driveTime }) => (
                <li key={slug}>
                  <Link
                    href={`/directions-from-benin-asaba-warri-onitsha#${slug}`}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-border p-4 text-sm hover:border-primary"
                  >
                    <span className="font-semibold">From {city}</span>
                    <span className="text-muted-foreground">{driveTime}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <Button asChild className="mt-6">
              <a href={MAPS_URL} target="_blank" rel="noopener noreferrer">
                <Navigation className="size-4" /> Open in Google Maps
              </a>
            </Button>
          </div>
          <div id="stay" className="scroll-mt-24 rounded-3xl border border-border bg-card p-6 sm:p-8">
            <BedDouble className="size-8 text-primary-ink" />
            <h2 className="mt-4 text-2xl font-semibold sm:text-3xl">Accommodation</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{ACCOMMODATION}</p>
            <Button asChild variant="outline" className="mt-6">
              <a
                href={whatsappUrl("Hi Park Vega! Can you recommend somewhere to stay near the park?")}
                target="_blank"
                rel="noopener noreferrer"
              >
                Ask for recommendations
              </a>
            </Button>
          </div>
        </div>
      </section>

      <FaqBlock
        className="bg-background"
        extra={[
          [
            "What time does Park Vega open and close?",
            `Park Vega is open ${OPEN_HOURS} on ${OPEN_DAYS_LONG}.`,
          ],
          [
            "Can I bring my own food to Park Vega?",
            "No. Outside food, alcohol, glassware and bottles are not allowed. Park Vega Restaurant serves meals, snacks and drinks inside the park.",
          ],
        ]}
      />
    </>
  );
}
