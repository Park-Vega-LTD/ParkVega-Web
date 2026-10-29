"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  Clock3,
  MapPin,
  Menu,
  Ticket,
  X,
} from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

import { Logo } from "@/components/parkvega/logo";
import { FacebookIcon, InstagramIcon, MailIcon, XLogoIcon, YouTubeIcon } from "@/components/parkvega/social-icons";
import { WhatsAppIcon } from "@/components/parkvega/whatsapp-icon";
import { Button } from "@/components/ui/button";
import {
  ADDRESS,
  EMAIL,
  MEMBERSHIPS,
  OPEN_DAYS_SHORT,
  OPEN_HOURS,
  PHONE_DISPLAY,
  PHONE_E164,
  SOCIAL_LINKS,
  whatsappUrl,
  ADMIN_URL,
} from "@/lib/site";
import { cn } from "@/lib/utils";

export type ParkInfo = { days: string; hours: string; notice: string | null };

const DEFAULT_PARK_INFO: ParkInfo = { days: OPEN_DAYS_SHORT, hours: OPEN_HOURS, notice: null };

/** Staff-managed hours and notice, provided by the public layout from site settings. */
const ParkInfoContext = createContext<ParkInfo>(DEFAULT_PARK_INFO);

function useHours() {
  return { ...useContext(ParkInfoContext), address: ADDRESS };
}

/**
 * True once the visitor has scrolled past most of the first screen. The
 * homepage uses it to keep the billboard free of menus until they scroll.
 */
function useScrolledPast(enabled: boolean) {
  const [past, setPast] = useState(!enabled);
  useEffect(() => {
    if (!enabled) return;
    const update = () => setPast(window.scrollY > window.innerHeight * 0.6);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [enabled]);
  return enabled ? past : true;
}

type NavLink = { label: string; to: string; blurb?: string };
type NavEntry = NavLink | { label: string; items: NavLink[] };

/** Primary navigation (brand guide §5): five areas plus a persistent Buy Tickets. */
const NAV: NavEntry[] = [
  { label: "Attractions", to: "/attractions" },
  { label: "Plan Your Visit", to: "/plan-your-visit" },
  {
    label: "Groups & Events",
    items: [
      { label: "Birthday parties", to: "/birthday-parties", blurb: "Cabanas, food and party packages" },
      { label: "School excursions", to: "/school-excursions", blurb: "Group pricing and safety" },
      { label: "Corporate & group bookings", to: "/services", blurb: "Cabanas, group hire and services" },
      { label: "Events calendar", to: "/events", blurb: "Seasonal events, holiday openings, promos" },
    ],
  },
  { label: "Dining", to: "/restaurants" },
  {
    label: "Visitor Information",
    items: [
      { label: "Ticket prices & hours", to: "/plan-your-visit#prices", blurb: "Full price list and opening days" },
      { label: "Directions", to: "/directions-from-benin-asaba-warri-onitsha", blurb: "From Benin, Asaba, Warri and Onitsha" },
      { label: "Park rules & safety", to: "/plan-your-visit#safety", blurb: "What to wear and what to leave at home" },
      { label: "Plan My Day", to: "/my-day", blurb: "A day plan built for your group" },
      { label: "Blog & guides", to: "/blog", blurb: "Visit tips and park news" },
    ],
  },
];

function isGroup(entry: NavEntry): entry is { label: string; items: NavLink[] } {
  return "items" in entry;
}

/** Desktop dropdown: click or Enter opens it; Escape or a click outside closes it. */
function NavDropdown({
  entry,
  open,
  active,
  onToggle,
  onClose,
}: {
  entry: { label: string; items: NavLink[] };
  open: boolean;
  active: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const id = `nav-${entry.label.toLowerCase().replace(/[^a-z]+/g, "-")}`;

  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => { if (!ref.current?.contains(event.target as Node)) onClose(); };
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onClick); document.removeEventListener("keydown", onKey); };
  }, [open, onClose]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={id}
        className={cn("flex min-h-11 items-center gap-1 rounded-lg px-3 text-[15px] font-semibold transition-colors hover:text-primary-ink", open || active ? "text-primary-ink" : "text-foreground")}
      >
        {entry.label} <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} aria-hidden="true" />
      </button>
      {open && (
        <ul id={id} className="absolute left-0 top-full mt-2 w-80 rounded-2xl border border-border bg-card p-2 shadow-[var(--shadow-card)]">
          {entry.items.map((item) => (
            <li key={item.to}>
              <Link href={item.to} onClick={onClose} className="block rounded-xl px-3 py-2.5 hover:bg-ocean-soft">
                <span className="block text-sm font-bold">{item.label}</span>
                {item.blurb && <span className="block text-xs text-muted-foreground">{item.blurb}</span>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const pathname = usePathname();
  const h = useHours();
  const isHome = pathname === "/";
  const revealed = useScrolledPast(isHome);
  const closeMenu = useCallback(() => setMenuOpen(null), []);

  const isActive = (to: string) => {
    const path = to.split("#")[0];
    return path === "/" ? pathname === "/" : pathname === path || pathname.startsWith(`${path}/`);
  };

  return <>
    {h.notice && !isHome && (
      <p role="status" className="bg-accent px-4 py-2 text-center text-sm font-semibold text-accent-foreground md:hidden">{h.notice}</p>
    )}
    <div className={cn("hidden bg-deep px-6 py-2 text-xs text-hero-foreground/80 md:items-center md:justify-between", !isHome && "md:flex")}>
      <span className="flex items-center gap-2"><Clock3 className="size-4" aria-hidden="true" /> {h.days} · {h.hours}</span>{h.notice && <span className="font-semibold text-accent">{h.notice}</span>}
      <span className="flex items-center gap-2"><MapPin className="size-4 text-secondary" aria-hidden="true" /> Agbor, Delta State</span>
    </div>
    {/* On the homepage the header stays out of the way of the billboard and slides in once the visitor scrolls. */}
    <header
      className={cn(
        "top-0 z-50 border-b border-border bg-background/95 backdrop-blur-xl",
        isHome ? "fixed inset-x-0 transition-transform duration-300" : "sticky",
        isHome && !revealed && "-translate-y-full",
      )}
      inert={isHome && !revealed ? true : undefined}
    >
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label="Park Vega Waterpark home" className="shrink-0"><Logo /></Link>
        <nav className="hidden items-center gap-1 xl:flex" aria-label="Main navigation">
          {NAV.map((entry) =>
            isGroup(entry) ? (
              <NavDropdown
                key={entry.label}
                entry={entry}
                open={menuOpen === entry.label}
                active={entry.items.some((item) => isActive(item.to))}
                onToggle={() => setMenuOpen((current) => (current === entry.label ? null : entry.label))}
                onClose={closeMenu}
              />
            ) : (
              <Link
                key={entry.to}
                href={entry.to}
                aria-current={isActive(entry.to) ? "page" : undefined}
                className={cn("flex min-h-11 items-center rounded-lg px-3 text-[15px] font-semibold transition-colors hover:text-primary-ink", isActive(entry.to) ? "text-primary-ink" : "text-foreground")}
              >
                {entry.label}
              </Link>
            ),
          )}
        </nav>
        <div className="flex items-center gap-1 sm:gap-2">
          <Link href="/my-bookings" className="hidden min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-muted-foreground hover:text-primary-ink sm:flex">My bookings</Link>
          <Button asChild variant="ticket" size="sm" className="h-11"><Link href="/tickets"><Ticket className="size-4" aria-hidden="true" /> Buy Tickets</Link></Button>
          <Button variant="ghost" size="icon" className="xl:hidden" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-controls="mobile-navigation" aria-label={open ? "Close menu" : "Open menu"}>{open ? <X /> : <Menu />}</Button>
        </div>
      </div>
      {open && (
        <nav id="mobile-navigation" className="max-h-[75vh] overflow-y-auto border-t border-border bg-background px-4 py-3 xl:hidden" aria-label="Mobile navigation">
          <ul className="grid gap-1">
            {NAV.map((entry) =>
              isGroup(entry) ? (
                <li key={entry.label} className="pt-3">
                  <p className="px-3 pb-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">{entry.label}</p>
                  <ul>
                    {entry.items.map((item) => (
                      <li key={item.to}>
                        <Link href={item.to} onClick={() => setOpen(false)} className={cn("flex min-h-12 items-center rounded-xl px-3 font-semibold", isActive(item.to) && "bg-ocean-soft text-primary-ink")}>{item.label}</Link>
                      </li>
                    ))}
                  </ul>
                </li>
              ) : (
                <li key={entry.to}>
                  <Link href={entry.to} onClick={() => setOpen(false)} className={cn("flex min-h-12 items-center rounded-xl px-3 text-lg font-bold", isActive(entry.to) && "bg-ocean-soft text-primary-ink")}>{entry.label}</Link>
                </li>
              ),
            )}
          </ul>
          <div className="mt-3 grid gap-2 border-t border-border pt-3">
            <Button asChild variant="ticket" className="w-full"><Link href="/tickets" onClick={() => setOpen(false)}><Ticket className="size-4" aria-hidden="true" /> Buy Tickets</Link></Button>
            <Button asChild variant="outline" className="w-full"><Link href="/my-bookings" onClick={() => setOpen(false)}>My bookings</Link></Button>
          </div>
        </nav>
      )}
    </header>
  </>;
}

const footerColumns = [
  {
    title: "Quick links",
    links: [
      { label: "Park Rules", to: "/plan-your-visit#safety" },
      { label: "Plan Your Visit", to: "/plan-your-visit" },
      { label: "Buy Tickets", to: "/tickets" },
      // No standalone terms page yet; the prohibited-items rules are the closest match.
      { label: "T & C", to: "/plan-your-visit#prohibited" },
      { label: "Restaurant", to: "/restaurants" },
    ],
  },
  {
    title: "Groups & getting here",
    links: [
      { label: "Birthday Parties", to: "/birthday-parties" },
      { label: "School Excursions", to: "/school-excursions" },
      { label: "Directions", to: "/directions-from-benin-asaba-warri-onitsha" },
    ],
  },
] as const;

const SOCIAL_ICONS = { youtube: YouTubeIcon, instagram: InstagramIcon, facebook: FacebookIcon, x: XLogoIcon } as const;

const footerLinkClass = "w-fit font-medium text-hero-foreground transition-colors hover:text-primary";
const footerHeadingClass = "font-sans text-sm font-bold uppercase tracking-[0.18em] text-coral";

/** Sand, surf and a floating ring and ball: the band where the page meets the footer. */
function FooterWaves() {
  return <div className="relative h-16 overflow-hidden sm:h-24" aria-hidden="true">
    <svg viewBox="0 0 1440 100" preserveAspectRatio="none" className="absolute inset-0 size-full">
      <rect width="1440" height="100" className="fill-accent" />
      <path d="M0 18 C 180 30 360 8 540 20 S 900 30 1080 16 S 1320 8 1440 20 V100 H0Z" className="fill-primary" />
      <path d="M0 62 C 200 82 380 50 600 66 S 980 84 1180 62 S 1380 56 1440 66 V100 H0Z" className="fill-primary-ink" />
      <path d="M0 84 C 240 96 480 78 720 88 S 1200 98 1440 84 V100 H0Z" className="fill-deep" />
      <circle cx="290" cy="6" r="7" fill="#fff" opacity=".9" /><circle cx="450" cy="32" r="6" fill="#fff" opacity=".35" />
      <circle cx="925" cy="70" r="4" fill="#fff" opacity=".6" /><circle cx="1455" cy="4" r="6" fill="#fff" opacity=".9" />
    </svg>
    <svg viewBox="0 0 120 52" className="absolute left-[40%] top-[12%] w-16 sm:w-28">
      <ellipse cx="60" cy="26" rx="58" ry="24" fill="#FF6B1A" /><ellipse cx="60" cy="26" rx="28" ry="11" className="fill-primary-ink" />
      <path d="M44 4h32v10H44zM44 38h32v10H44z" fill="#fff" />
    </svg>
    <svg viewBox="0 0 40 40" className="absolute left-[65.5%] top-[18%] w-7 sm:w-11">
      <circle cx="20" cy="20" r="19" fill="#fff" />
      <path d="M20 20V1a19 19 0 0 1 19 19z" fill="#FF6B1A" /><path d="M20 20h19a19 19 0 0 1-19 19z" className="fill-accent" />
      <path d="M20 20v19A19 19 0 0 1 1 20z" fill="#1E88E5" />
    </svg>
  </div>;
}

export function SiteFooter() {
  const h = useHours();
  const socials = SOCIAL_LINKS.filter((social) => social.url);
  return <footer className="bg-deep text-hero-foreground">
    <FooterWaves />
    <div className="px-4 pb-10 pt-12 sm:px-6 lg:pt-16">
      <div className="mx-auto grid max-w-7xl gap-10 sm:grid-cols-2 lg:grid-cols-[1.9fr_1fr_1.1fr_1.3fr]">
        <div className="sm:col-span-2 lg:col-span-1">
          <Link href="/" aria-label="Park Vega Waterpark home" className="inline-block"><Logo tone="onDark" className="h-auto w-44" /></Link>
          <p className="mt-6 font-display text-2xl font-bold sm:text-[28px]">Delivering Your Kind Of Fun</p>
          <ul className="mt-6 flex flex-wrap gap-3">
            {socials.map((social) => {
              const Icon = SOCIAL_ICONS[social.network];
              return <li key={social.network}><a href={social.url!} target="_blank" rel="noopener noreferrer" aria-label={`Park Vega on ${social.label}`} className="grid size-13 place-items-center rounded-full bg-white/10 transition-colors hover:bg-white/20"><Icon className="size-7" /></a></li>;
            })}
            <li><a href={`mailto:${EMAIL}`} aria-label={`Email Park Vega at ${EMAIL}`} className="grid size-13 place-items-center rounded-full bg-white/10 transition-colors hover:bg-white/20"><MailIcon className="size-7" /></a></li>
          </ul>
        </div>
        {footerColumns.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <h2 className={footerHeadingClass}>{column.title}</h2>
            <ul className="mt-5 grid gap-3 text-lg">{column.links.map((item) => <li key={item.label}><Link href={item.to} className={footerLinkClass}>{item.label}</Link></li>)}</ul>
          </nav>
        ))}
        <div>
          <h2 className={footerHeadingClass}>Contact</h2>
          <address className="mt-5 grid gap-3 text-lg not-italic">
            <p className="text-hero-foreground/80">{h.address}</p>
            <a href={`mailto:${EMAIL}`} className={footerLinkClass}>{EMAIL}</a>
            <a href={`tel:${PHONE_E164}`} className={footerLinkClass}>{PHONE_DISPLAY}</a>
            <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer" className={footerLinkClass}>Chat on WhatsApp</a>
          </address>
        </div>
      </div>
      <div className="mx-auto mt-12 flex max-w-7xl flex-col items-start gap-5 rounded-3xl bg-white px-6 py-6 text-deep sm:flex-row sm:items-center sm:gap-8 sm:px-8">
        <p className="shrink-0 font-sans text-sm font-bold uppercase tracking-[0.18em] text-deep/75">Proud members of</p>
        <ul className="flex flex-wrap items-center gap-6">
          {MEMBERSHIPS.map((member) => (
            <li key={member.name}>
              <a href={member.url} target="_blank" rel="noopener noreferrer" className="block transition-opacity hover:opacity-80">
                {member.logo
                  ? <Image src={member.logo.src} alt={member.name} width={member.logo.width} height={member.logo.height} className="h-14 w-auto" />
                  : <span className="block rounded-lg border border-deep/15 px-4 py-2 font-display text-lg font-bold text-primary-ink">{member.name}</span>}
              </a>
            </li>
          ))}
        </ul>
      </div>
      <div className="mx-auto mt-12 flex max-w-7xl flex-col items-center gap-2 border-t border-white/15 pt-8 text-center text-sm uppercase tracking-wider text-hero-foreground/70">
        <p>Copyright © {new Date().getFullYear()} Park Vega. All rights reserved.</p>
        <a href={`${ADMIN_URL}/login`} className="text-xs normal-case tracking-normal text-hero-foreground/40 hover:text-hero-foreground">Staff login</a>
      </div>
    </div>
  </footer>;
}

/** Hides fixed CTAs on the homepage until the billboard has scrolled away, so the first screen shows only its six elements. */
function useRevealOffHome() {
  const isHome = usePathname() === "/";
  return useScrolledPast(isHome);
}

/** Pages where the visitor is already buying, so the sticky CTA would only cover the form. */
const NO_TICKET_BAR = ["/tickets", "/booking"];

export function MobileTicketBar() {
  const revealed = useRevealOffHome();
  const pathname = usePathname();
  if (NO_TICKET_BAR.some((path) => pathname.startsWith(path))) return null;
  return <div className={cn("fixed inset-x-3 bottom-3 z-50 rounded-2xl border border-border bg-background/95 p-2 shadow-2xl backdrop-blur transition-all duration-300 md:hidden", !revealed && "pointer-events-none translate-y-24 opacity-0")} inert={!revealed ? true : undefined}><Button asChild variant="ticket" className="w-full"><Link href="/tickets"><Ticket className="size-4" /> Buy Tickets</Link></Button></div>;
}

export function FloatingWhatsApp() {
  const revealed = useRevealOffHome();
  return <a
    href={whatsappUrl()}
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Chat with Park Vega on WhatsApp"
    inert={!revealed ? true : undefined}
    className={cn("fixed bottom-24 right-4 z-50 flex size-14 items-center justify-center rounded-full bg-whatsapp text-white shadow-2xl transition-all duration-300 hover:scale-105 md:bottom-6 md:right-6", !revealed && "pointer-events-none translate-y-6 opacity-0")}
  >
    <WhatsAppIcon className="size-7" />
  </a>;
}


export function PageShell({ children, className }: { children: ReactNode; className?: string }) {
  return <main className={cn("min-h-screen bg-background pb-20 text-foreground md:pb-0", className)}><SiteHeader />{children}<SiteFooter /><MobileTicketBar /><FloatingWhatsApp /></main>;
}

export function SiteChrome({ children, className, info = DEFAULT_PARK_INFO }: { children: ReactNode; className?: string; info?: ParkInfo }) {
  return <ParkInfoContext.Provider value={info}><PageShell className={className}>{children}</PageShell></ParkInfoContext.Provider>;
}
