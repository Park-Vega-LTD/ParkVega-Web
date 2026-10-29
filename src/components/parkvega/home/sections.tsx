import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Cake,
  Check,
  Hash,
  LifeBuoy,
  Lock,
  MapPin,
  Megaphone,
  Navigation,
  School,
  ShieldCheck,
  Ticket,
  Umbrella,
  UtensilsCrossed,
  Waves,
  type LucideIcon,
} from "lucide-react";

import { SectionHeading } from "@/components/parkvega/page-hero";
import { ReviewsGrid } from "@/components/parkvega/reviews-grid";
import { WhatsAppButton } from "@/components/parkvega/whatsapp-button";
import { WhatsAppIcon } from "@/components/parkvega/whatsapp-icon";
import { Button } from "@/components/ui/button";
import {
  DIRECTION_CITIES,
  type AttractionHighlight,
  type MenuHighlight,
} from "@/lib/home-content";
import {
  ADDRESS,
  MAPS_URL,
  OPEN_DAYS_SHORT,
  OPEN_HOURS,
  directionsUrl,
  formatNaira,
  whatsappUrl,
} from "@/lib/site";

/** Inline style that staggers a `data-reveal` element by its position in a list. */
const stagger = (i: number) => ({ "--i": i }) as CSSProperties;

/** Shared hover lift for cards (Tailwind v4 translate is its own CSS property, so it is listed explicitly). */
const CARD_HOVER =
  "transition-[translate,box-shadow,border-color] duration-300 ease-out hover:-translate-y-1.5 hover:border-primary/50 hover:shadow-[var(--shadow-card)]";

const WHY: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: Waves, title: "15 attractions", text: "Wave pool, slides, splash zones – one ticket, unlimited rides." },
  { icon: ShieldCheck, title: "Safety first", text: "Life jackets for non-swimmers and staff on hand to show you how to ride every slide safely." },
  { icon: LifeBuoy, title: "Kids' zones", text: "Zero-depth pools, anti-slip floors and the 50-feature Aqua Tower." },
  { icon: Umbrella, title: "Cabanas & food", text: "Private cabanas for 12 with TV, phone charging and a fan – plus food, drinks and a swim-up bar." },
];

export function WhyParkVega() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
      <SectionHeading eyebrow="Why Park Vega" title="One ticket. A whole day of fun." />
      <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {WHY.map(({ icon: Icon, title, text }, i) => (
          <div key={title} data-reveal style={stagger(i)} className={`group rounded-3xl border border-border bg-card p-6 ${CARD_HOVER}`}>
            <span className="grid size-12 place-items-center rounded-2xl bg-ocean-soft text-primary-ink transition-[rotate,scale,background-color] duration-300 group-hover:-rotate-6 group-hover:scale-110 group-hover:bg-primary/20">
              <Icon className="size-6" />
            </span>
            <h3 className="mt-5 text-lg font-semibold">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function AttractionsSection({ items }: { items: AttractionHighlight[] }) {
  return (
    <section className="bg-ocean-soft/50 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <SectionHeading
            eyebrow="15 attractions · one ticket"
            title="Slides, waves and splash zones for every age."
            description="Your ticket covers unlimited rides on every attraction, from the ocean-sized Wave Pool to our steepest slides."
          />
          <Button asChild variant="outline" data-reveal style={stagger(2)} className="group">
            <Link href="/attractions">
              All attractions <ArrowRight className="size-4 transition-[translate] duration-300 group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>
        <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => (
            <article
              key={item.name}
              data-reveal
              style={stagger(i)}
              className={`group overflow-hidden rounded-3xl border border-border bg-card ${CARD_HOVER}`}
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <Image
                  src={item.image}
                  alt={`${item.name} at Park Vega Waterpark`}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-[scale] duration-700 ease-out group-hover:scale-110"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-deep/40 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                />
              </div>
              <div className="p-5">
                <h3 className="text-xl font-semibold transition-colors duration-300 group-hover:text-primary-ink">{item.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                {item.tags.length > 0 && (
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {item.tags.map((tag) => (
                      <li
                        key={tag}
                        className="rounded-full bg-ocean-soft px-3 py-1 text-xs font-bold text-foreground transition-colors duration-300 group-hover:bg-primary/20"
                      >
                        {tag}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function PlanYourVisitSection({ fromPrice }: { fromPrice: number }) {
  const prices = [
    { who: "Adults & kids over 150cm", price: `From ${formatNaira(fromPrice)}` },
    { who: "Kids 90cm – 150cm", price: "Child rate" },
    { who: "Kids under 90cm", price: "Free" },
    { who: "Private cabana · seats 12", price: "Book ahead" },
  ];
  const essentials = [
    `Open ${OPEN_DAYS_SHORT}, ${OPEN_HOURS}`,
    "Swimwear required on all slides – no jewellery on rides",
    "Children under 150cm must be with an adult",
    "Non-swimmers must use life jackets or tubes and stay in the shallow end",
  ];
  return (
    <section className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-2">
      <div>
        <SectionHeading eyebrow="Plan your visit" title="Everything you need for a perfect day." />
        <ul className="mt-8 grid gap-3">
          {essentials.map((line, i) => (
            <li key={line} data-reveal style={stagger(i)} className="flex items-start gap-3 text-sm">
              <Check className="mt-0.5 size-5 shrink-0 text-primary-ink" /> {line}
            </li>
          ))}
        </ul>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild variant="ticket">
            <Link href="/tickets">
              <Ticket className="size-4" /> Buy Tickets
            </Link>
          </Button>
          <WhatsAppButton variant="outline" message="Hi Park Vega! I have a question about my visit.">
            Ask on WhatsApp
          </WhatsAppButton>
          <Button asChild variant="ghost">
            <Link href="/plan-your-visit">
              Full visit guide <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
      <div data-reveal style={stagger(1)} className="overflow-hidden rounded-3xl border border-border bg-card">
        <table className="w-full text-left text-sm">
          <caption className="bg-deep px-5 py-4 text-left font-display text-lg font-semibold text-hero-foreground">
            Ticket prices
          </caption>
          <tbody>
            {prices.map(({ who, price }) => (
              <tr key={who} className="border-t border-border">
                <th scope="row" className="px-5 py-4 font-semibold">{who}</th>
                <td className="px-5 py-4 text-right font-display text-base font-bold text-primary-ink">{price}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="border-t border-border bg-muted px-5 py-3 text-xs text-muted-foreground">
          Schools, corporates and groups above 20 get group pricing –{" "}
          <a
            href={whatsappUrl("Hi Park Vega! I'd like group pricing for 20+ people.")}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-foreground underline underline-offset-2"
          >
            ask on WhatsApp
          </a>
          .
        </p>
      </div>
    </section>
  );
}

export function RestaurantSection({ items }: { items: MenuHighlight[] }) {
  return (
    <section className="bg-deep py-16 text-hero-foreground sm:py-20">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:items-center">
        <div>
          <span className="text-xs font-extrabold uppercase text-secondary">Park Vega Restaurant</span>
          <h2 className="mt-3 text-balance text-[1.75rem] font-bold leading-tight sm:text-4xl">Hungry? We&apos;ve got you.</h2>
          <p className="mt-4 max-w-md leading-relaxed text-hero-foreground/75">
            Jollof, burgers, pizza, wings and cold drinks – right inside the park. Order online and pick up in person.
          </p>
          <div className="relative mt-8 aspect-[4/3] overflow-hidden rounded-3xl">
            <Image
              src="/park-food.jpg"
              alt="Jollof rice, chicken and tropical drinks at Park Vega Restaurant"
              fill
              sizes="(max-width: 1024px) 100vw, 45vw"
              className="object-cover"
            />
          </div>
        </div>
        <div>
          <ul className="grid gap-3">
            {items.map((item, i) => (
              <li
                key={item.name}
                data-reveal
                style={stagger(i)}
                className="flex items-center justify-between gap-4 rounded-2xl border border-hero-foreground/15 bg-hero-foreground/5 p-5 transition-[translate,background-color,border-color] duration-300 hover:translate-x-1.5 hover:border-secondary/60 hover:bg-hero-foreground/10"
              >
                <div>
                  <span className="text-[11px] font-extrabold uppercase text-secondary">{item.label}</span>
                  <p className="mt-1 font-semibold">{item.name}</p>
                  {item.detail && <p className="text-sm text-hero-foreground/65">{item.detail}</p>}
                </div>
                <span className="shrink-0 font-display text-xl font-bold">{formatNaira(item.price)}</span>
              </li>
            ))}
          </ul>
          <Button asChild variant="ticket" className="mt-6">
            <Link href="/restaurants">
              <UtensilsCrossed className="size-4" /> See full menu & order
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

export function CelebrateSection() {
  const cards = [
    {
      icon: Cake,
      title: "Birthday parties",
      text: "Turn a birthday into a splash day. Book a private cabana, add food and drinks, and let the party loose on every slide.",
      points: ["Private cabana for up to 12 guests", "Food & drinks on site"],
      cta: "Plan a party",
      message: "Hi Park Vega! I'd like to plan a birthday party.",
      href: "/birthday-parties",
      more: "Party packages",
    },
    {
      icon: School,
      title: "School excursions",
      text: "A fun, safe day out for pupils, with zero-depth kids' pools, anti-slip floors and life jackets for non-swimmers.",
      points: ["Group pricing for schools", "Staff guidance on every slide"],
      cta: "Book a school trip",
      message: "Hi Park Vega! I'd like to book a school excursion.",
      href: "/school-excursions",
      more: "School trips",
    },
  ];
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
      <SectionHeading
        eyebrow="Celebrate with us"
        title="Birthdays & school trips."
        description="Bring the whole crew. We'll help you plan everything on WhatsApp, from cabanas to group tickets."
      />
      <div className="mt-9 grid gap-5 md:grid-cols-2">
        {cards.map(({ icon: Icon, title, text, points, cta, message, href, more }, i) => (
          <article
            key={title}
            data-reveal
            style={stagger(i)}
            className={`group flex flex-col rounded-3xl border border-border bg-card p-6 sm:p-8 ${CARD_HOVER}`}
          >
            <span className="grid size-12 place-items-center rounded-2xl bg-accent text-accent-foreground transition-[rotate,scale] duration-300 group-hover:-rotate-6 group-hover:scale-110">
              <Icon className="size-6" />
            </span>
            <h3 className="mt-5 text-2xl font-semibold">{title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{text}</p>
            <ul className="mt-5 grid gap-2 text-sm">
              {points.map((point) => (
                <li key={point} className="flex items-center gap-2">
                  <Check className="size-4 text-primary-ink" /> {point}
                </li>
              ))}
            </ul>
            <div className="mt-auto flex flex-wrap gap-3 pt-7">
              <WhatsAppButton message={message}>{cta}</WhatsAppButton>
              <Button asChild variant="outline">
                <Link href={href}>
                  {more} <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function GettingHereSection() {
  return (
    <section className="bg-ocean-soft/50 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading eyebrow="Getting here" title="Easy to reach from across the South." description={ADDRESS} />
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild>
            <a href={MAPS_URL} target="_blank" rel="noopener noreferrer">
              <MapPin className="size-4" /> Open in Google Maps
            </a>
          </Button>
          <Button asChild variant="outline">
            <Link href="/directions-from-benin-asaba-warri-onitsha">
              Detailed directions <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
        <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {DIRECTION_CITIES.map(({ city, origin, note }, i) => (
            <a
              key={city}
              href={directionsUrl(origin)}
              target="_blank"
              rel="noopener noreferrer"
              data-reveal
              style={stagger(i)}
              className={`group flex flex-col rounded-3xl border border-border bg-card p-6 ${CARD_HOVER}`}
            >
              <h3 className="text-lg font-semibold">{city} → Park Vega</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{note}</p>
              <span className="mt-5 flex items-center gap-2 text-sm font-bold text-primary-ink">
                <Navigation className="size-4 transition-[rotate] duration-300 group-hover:rotate-12" /> Get directions
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ReviewsSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
      <SectionHeading eyebrow="Google reviews" title="Loved by families across Nigeria." />
      <div className="mt-9">
        <ReviewsGrid />
      </div>
    </section>
  );
}

/** Decorative bubbles for cyan sections (brand guide: bubbles, ripples, droplets). */
function Bubbles() {
  const bubbles = [
    "left-[6%] top-[18%] size-14",
    "left-[14%] bottom-[12%] size-20",
    "right-[8%] top-[10%] size-24",
    "right-[16%] bottom-[20%] size-10",
    "left-[45%] top-[6%] size-8",
  ];
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {bubbles.map((position) => (
        <span key={position} className={`absolute rounded-full bg-white/25 ${position}`} />
      ))}
    </div>
  );
}

/**
 * Three visitor-information cards (brand guide §6, section 04): ticket
 * prices, park rules and prohibited items, each opening its section of the
 * Plan Your Visit page.
 */
export function VisitorInfoCards({ fromPrice }: { fromPrice: number }) {
  const cards: { icon: LucideIcon; title: string; text: string; href: string }[] = [
    { icon: Hash, title: "Ticket Prices", text: `From ${formatNaira(fromPrice)}. Kids under 90cm go free.`, href: "/plan-your-visit#prices" },
    { icon: Megaphone, title: "Park Rules", text: "15 simple rules that keep everyone safe.", href: "/plan-your-visit#safety" },
    { icon: Lock, title: "Prohibited Items", text: "What to leave at home or in your car.", href: "/plan-your-visit#prohibited" },
  ];
  return (
    <section className="relative isolate overflow-hidden bg-primary py-16 sm:py-20">
      <Bubbles />
      <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6">
        <h2 className="text-[1.75rem] font-bold leading-tight text-primary-foreground sm:text-4xl">Plan Your Visit</h2>
        <p className="mt-2 text-lg text-primary-foreground/85">Everything to know before you go.</p>
        <ul className="mt-10 grid gap-5 md:grid-cols-3">
          {cards.map(({ icon: Icon, title, text, href }, i) => (
            <li key={title} data-reveal style={stagger(i)}>
              <Link
                href={href}
                className="group flex h-full flex-col items-center rounded-3xl bg-card px-6 py-10 shadow-[var(--shadow-card)] transition-transform hover:-translate-y-1"
              >
                <span className="grid size-20 place-items-center rounded-full bg-ocean-soft text-foreground transition-[scale,background-color] duration-300 group-hover:scale-110 group-hover:bg-primary/20">
                  <Icon className="size-10" strokeWidth={2.5} aria-hidden="true" />
                </span>
                <h3 className="mt-6 text-xl font-bold">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{text}</p>
                <span className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-primary-ink group-hover:underline">
                  See details <ArrowRight className="size-4" aria-hidden="true" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function FinalCta({ fromPrice }: { fromPrice: number }) {
  return (
    <section className="px-4 pb-16 sm:px-6 sm:pb-20">
      <div data-reveal className="mx-auto max-w-7xl rounded-3xl bg-primary px-6 py-14 text-center text-primary-foreground sm:px-12">
        <h2 className="mx-auto max-w-2xl text-balance text-[1.75rem] font-bold leading-tight sm:text-4xl">Ready to make a splash?</h2>
        <p className="mx-auto mt-4 max-w-xl text-primary-foreground/85">
          Tickets from {formatNaira(fromPrice)} · {OPEN_DAYS_SHORT} · Agbor, Delta State
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild variant="ticket" size="lg">
            <Link href="/tickets">
              <Ticket className="size-5" /> Buy Tickets
            </Link>
          </Button>
          <Button asChild size="lg" className="bg-whatsapp text-white hover:bg-whatsapp/90">
            <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer">
              <WhatsAppIcon className="size-5" /> WhatsApp us
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
