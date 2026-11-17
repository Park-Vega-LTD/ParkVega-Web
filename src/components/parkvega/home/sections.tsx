import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Hash,
  LifeBuoy,
  Lock,
  MapPin,
  Megaphone,
  Navigation,
  ShieldCheck,
  Ticket,
  Umbrella,
  UtensilsCrossed,
  Waves,
  type LucideIcon,
} from "lucide-react";

import { SectionHeading } from "@/components/parkvega/page-hero";
import { AttractionVideo } from "@/components/parkvega/home/attraction-video";
import { VideoShorts } from "@/components/parkvega/home/video-shorts";
import { BlockIcon } from "@/components/parkvega/block-icon";
import { TestimonialsCarousel } from "@/components/parkvega/testimonials";
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
  directionsUrl,
  formatNaira,
  shortDays,
  whatsappUrl,
} from "@/lib/site";
import type { CelebrateBlock, PlanVisitBlock, TestimonialsBlock, VideosBlock } from "@/lib/page-blocks";
import type { Photo } from "@/lib/site-photos";

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
              <div className="relative aspect-[16/10] overflow-hidden bg-ocean-soft">
                {item.image && (
                  <Image
                    src={item.image}
                    alt={`${item.name} at Park Vega Waterpark`}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-[scale] duration-700 ease-out group-hover:scale-110"
                  />
                )}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-deep/40 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                />
                {item.video && <AttractionVideo url={item.video} name={item.name} />}
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

export function PlanYourVisitSection({
  fromPrice,
  hours,
  block,
}: {
  fromPrice: number;
  /** Opening days and hours from Admin → Settings. */
  hours: { opening_days: string; opening_hours: string };
  /** Staff-edited copy (Admin → Homepage sections), or the built-in one. */
  block: PlanVisitBlock;
}) {
  const rules = [
    { icon: "clock", text: `Open ${shortDays(hours.opening_days)}, ${hours.opening_hours}` },
    ...block.rules,
  ];
  return (
    <section id="plan-your-visit" className="mx-auto grid max-w-7xl scroll-mt-24 gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-2">
      <div>
        <SectionHeading eyebrow={block.eyebrow} title={block.title} description={block.description || undefined} />
        <ul className="mt-8 grid gap-3">
          {rules.map(({ icon, text }, i) => (
            <li key={`${i}-${text}`} data-reveal style={stagger(i)} className="group flex items-center gap-4 text-sm sm:text-base">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-ocean-soft text-primary-ink ring-1 ring-primary/20 transition-[rotate,scale,background-color] duration-300 group-hover:-rotate-6 group-hover:scale-110 group-hover:bg-primary/20">
                <BlockIcon name={icon} className="size-5" />
              </span>
              {text}
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
            {block.price_title}
          </caption>
          <tbody>
            {block.prices.map(({ label, value }, i) => (
              <tr key={`${i}-${label}`} className="border-t border-border">
                <th scope="row" className="px-5 py-4 font-semibold">{label}</th>
                <td className="px-5 py-4 text-right font-display text-base font-bold text-primary-ink">
                  {value.replaceAll("{from_price}", formatNaira(fromPrice))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {block.group_note && (
          <p className="border-t border-border bg-muted px-5 py-3 text-xs text-muted-foreground">
            {block.group_note}{" "}
            <a
              href={whatsappUrl("Hi Park Vega! I'd like group pricing for 20+ people.")}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-foreground underline underline-offset-2"
            >
              Ask on WhatsApp
            </a>
            .
          </p>
        )}
      </div>
    </section>
  );
}

export function RestaurantSection({
  items,
  photo = null,
}: {
  items: MenuHighlight[];
  /** The `home/restaurant` spot photo staff chose, if any. */
  photo?: Photo | null;
}) {
  return (
    <section className="bg-deep py-16 text-hero-foreground sm:py-20">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:items-center">
        <div>
          <span className="text-xs font-extrabold uppercase text-secondary">Park Vega Restaurant</span>
          <h2 className="mt-3 text-balance text-[1.75rem] font-bold leading-tight sm:text-4xl">Hungry? We&apos;ve got you.</h2>
          <p className="mt-4 max-w-md leading-relaxed text-hero-foreground/75">
            Jollof, burgers, pizza, wings and cold drinks – right inside the park. Order online and pick up in person.
          </p>
          {photo && (
            <div className="relative mt-8 aspect-[4/3] overflow-hidden rounded-3xl">
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                sizes="(max-width: 1024px) 100vw, 45vw"
                className="object-cover"
              />
            </div>
          )}
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

export function CelebrateSection({ block }: { block: CelebrateBlock }) {
  return (
    <section id="celebrate" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-16 sm:px-6 sm:py-20">
      <SectionHeading eyebrow={block.eyebrow} title={block.title} description={block.description || undefined} />
      <div className={`mt-9 grid gap-5 ${block.cards.length === 3 ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
        {block.cards.map((card, i) => (
          <article
            key={`${i}-${card.title}`}
            data-reveal
            style={stagger(i)}
            className={`group flex flex-col rounded-3xl border border-border bg-card p-6 sm:p-8 ${CARD_HOVER}`}
          >
            <span className="grid size-12 place-items-center rounded-2xl bg-accent text-accent-foreground transition-[rotate,scale] duration-300 group-hover:-rotate-6 group-hover:scale-110">
              <BlockIcon name={card.icon} className="size-6" />
            </span>
            <h3 className="mt-5 text-2xl font-semibold">{card.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{card.text}</p>
            {card.points.length > 0 && (
              <ul className="mt-5 grid gap-2 text-sm">
                {card.points.map((point, j) => (
                  <li key={`${j}-${point}`} className="flex items-center gap-2">
                    <Check className="size-4 text-primary-ink" /> {point}
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-auto flex flex-wrap gap-3 pt-7">
              <WhatsAppButton message={card.whatsapp_message}>{card.button_label}</WhatsAppButton>
              <Button asChild variant="outline">
                <Link href={card.link_href}>
                  {card.link_label} <ArrowRight className="size-4" />
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

/** Real Park Vega photo behind the videos band. */
const VIDEOS_BACKDROP =
  "https://res.cloudinary.com/rlenhslv/image/upload/v1794922625/parkvega/site/photos/heroes/plan-your-visit.jpg";

export function VideosSection({
  block,
  backdrop = null,
}: {
  block: VideosBlock;
  /** The `home/videos` spot photo staff chose, if any. */
  backdrop?: Photo | null;
}) {
  return (
    <section id="park-videos" aria-labelledby="videos-title" className="scroll-mt-24 px-3 py-10 sm:px-6 sm:py-14">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl bg-deep">
        <Image src={backdrop?.src ?? VIDEOS_BACKDROP} alt="" fill sizes="100vw" className="object-cover" />
        {/* Darker on the text side, lighter behind the videos so the park shows through. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-deep/90 via-deep/70 to-deep/40 lg:bg-gradient-to-r lg:from-deep/95 lg:via-deep/70 lg:to-deep/20"
        />
        <Bubbles />

        <div className="relative grid items-center gap-10 px-5 py-12 sm:px-10 sm:py-16 lg:grid-cols-[1fr_1.15fr] lg:gap-12 lg:px-14">
          <div>
            <span data-reveal className="text-xs font-extrabold uppercase tracking-wide text-secondary">
              {block.eyebrow}
            </span>
            <h2
              id="videos-title"
              data-reveal
              style={stagger(1)}
              className="mt-3 text-balance text-[2rem] font-bold leading-tight text-hero-foreground sm:text-5xl"
            >
              {block.title}
            </h2>
            {block.description && (
              <p data-reveal style={stagger(2)} className="mt-4 max-w-md text-base leading-relaxed text-hero-foreground/80 sm:text-lg">
                {block.description}
              </p>
            )}
            {block.chips.length > 0 && (
              <ul data-reveal style={stagger(3)} className="mt-6 flex flex-wrap gap-2">
                {block.chips.map((chip, i) => (
                  <li
                    key={`${i}-${chip}`}
                    className="rounded-full border border-hero-foreground/25 bg-hero-foreground/10 px-3 py-1.5 text-xs font-bold text-hero-foreground backdrop-blur-md"
                  >
                    {chip}
                  </li>
                ))}
              </ul>
            )}
            <div data-reveal style={stagger(4)} className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="ticket">
                <Link href="/tickets">
                  <Ticket className="size-4" /> Buy Tickets
                </Link>
              </Button>
              <Button asChild variant="glass">
                <Link href="/attractions">
                  All attractions <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>

          <VideoShorts
            videos={block.videos.map((video) => ({ id: video.youtube_id, title: video.title, badge: video.badge, tone: video.tone }))}
          />
        </div>
      </div>
    </section>
  );
}

export function TestimonialsSection({ block }: { block: TestimonialsBlock }) {
  return (
    <section id="testimonials" className="scroll-mt-24 overflow-hidden py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading eyebrow={block.eyebrow} title={block.title} description={block.description || undefined} />
      </div>
      <div className="mt-7">
        <TestimonialsCarousel testimonials={block.testimonials} />
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

export function FinalCta({ fromPrice, openingDays }: { fromPrice: number; openingDays: string }) {
  return (
    <section className="px-4 pb-16 sm:px-6 sm:pb-20">
      <div data-reveal className="mx-auto max-w-7xl rounded-3xl bg-primary px-6 py-14 text-center text-primary-foreground sm:px-12">
        <h2 className="mx-auto max-w-2xl text-balance text-[1.75rem] font-bold leading-tight sm:text-4xl">Ready to make a splash?</h2>
        <p className="mx-auto mt-4 max-w-xl text-primary-foreground/85">
          Tickets from {formatNaira(fromPrice)} · {shortDays(openingDays)} · Agbor, Delta State
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
