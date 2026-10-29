import Link from "next/link";
import { CalendarDays, MapPin, Ticket } from "lucide-react";

import { HeroCarousel, type HeroSlide } from "@/components/parkvega/home/hero-carousel";
import { Logo } from "@/components/parkvega/logo";
import { WhatsAppIcon } from "@/components/parkvega/whatsapp-icon";
import { Button } from "@/components/ui/button";
import { MAPS_URL, TOWN, formatNaira, shortDays, whatsappUrl } from "@/lib/site";
import type { PageImage, SiteSettings } from "@/types/api";

const DEFAULT_HERO_IMAGE = "/photos/slide-tower-tubes.jpg";

/**
 * Above-the-fold homepage billboard: a photo carousel (with the autoplay
 * video behind the first slide) under the starting ticket price, opening
 * days, the location pin, a WhatsApp button and the Buy Ticket button, which
 * stay put while the slides change. No menus.
 */
export function Billboard({
  fromPrice,
  settings,
  heroImages = [],
}: {
  fromPrice: number;
  settings: Pick<SiteSettings, "opening_days" | "opening_hours" | "hero_video_url" | "hero_image_url">;
  /** Photos staff chose for the `home/hero` slot, in order. Each replaces that slide's photo; headlines stay. */
  heroImages?: Pick<PageImage, "url" | "alt_text">[];
}) {
  const builtIn: HeroSlide[] = [
    {
      image: settings.hero_image_url || DEFAULT_HERO_IMAGE,
      alt: "Smiling guests peek through yellow double tubes in front of Park Vega's colourful slide tower",
      eyebrow: "Park Vega Waterpark · Agbor",
      headline: "Delivering your kind of fun",
    },
    { image: "/photos/mat-racer-splash.jpg", alt: "A laughing rider on a blue mat bursts through the spray at the bottom of an orange slide", eyebrow: "Thrill slides", headline: "Twist, drop and splash", position: "50% 20%" },
    { image: "/photos/racing-slide-friends.jpg", alt: "Two friends cheering as they race each other down side-by-side slide lanes", eyebrow: "Racing slides", headline: "Race your crew to the bottom", position: "50% 12%" },
    { image: "/photos/wave-pool-tubes.jpg", alt: "Friends raising their arms from yellow rubber rings in the wave pool, with the slide tower behind", eyebrow: "Wave pool", headline: "Float the afternoon away", position: "50% 55%" },
    { image: "/splash-pad.jpg", alt: "Children cheering under a tipping water bucket in the kids' splash zone", eyebrow: "Kids' splash zone", headline: "Little ones, big splashes" },
    { image: "/park-food.jpg", alt: "Jollof rice, grilled chicken and fried plantain with fresh fruit drinks by the pool", eyebrow: "Food & drinks", headline: "Refuel without leaving the park" },
  ];
  // A chosen photo is framed by the editor, so the built-in crop no longer applies.
  const slides = builtIn.map((slide, index) => {
    const chosen = heroImages[index];
    return chosen ? { ...slide, image: chosen.url, alt: chosen.alt_text, position: undefined } : slide;
  });
  return (
    <HeroCarousel
      slides={slides}
      videoUrl={settings.hero_video_url}
      logo={
        <Link href="/" className="w-fit" aria-label="Park Vega Waterpark home">
          <Logo tone="onDark" size="lg" />
        </Link>
      }
    >
          <div className="mt-6 grid gap-2 sm:mt-8 sm:gap-3 lg:grid-cols-[auto_minmax(0,1.5fr)_minmax(0,1fr)_auto] lg:items-stretch">
            {/* 2. Ticket price */}
            <div className="flex flex-col justify-center gap-1 rounded-2xl bg-hero-foreground px-5 py-3 text-foreground shadow-xl lg:px-6">
              <span className="block text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
                Tickets from
              </span>
              <span className="block font-display text-4xl font-extrabold leading-none">
                {formatNaira(fromPrice)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:contents">
              {/* 3. Opening days */}
              <div className="flex items-center gap-3 rounded-2xl border border-hero-foreground/20 bg-deep/55 px-3 py-3 backdrop-blur-md sm:px-4">
                <span className="hidden size-9 shrink-0 items-center justify-center rounded-full bg-secondary/15 sm:flex">
                  <CalendarDays className="size-[18px] text-secondary" />
                </span>
                <p className="text-sm leading-snug">
                  <span className="block font-bold sm:hidden">Open {shortDays(settings.opening_days)}</span>
                  <span className="hidden font-bold sm:block">Open {settings.opening_days}</span>
                  <span className="text-hero-foreground/75">{settings.opening_hours}</span>
                </p>
              </div>

              {/* 4. Location pin */}
              <a
                href={MAPS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 rounded-2xl border border-hero-foreground/20 bg-deep/55 px-3 py-3 backdrop-blur-md transition-colors hover:bg-deep/75 sm:px-4"
              >
                <span className="hidden size-9 shrink-0 items-center justify-center rounded-full bg-secondary/15 sm:flex">
                  <MapPin className="size-[18px] text-secondary" />
                </span>
                <span className="text-sm leading-snug">
                  <span className="block font-bold">{TOWN}</span>
                  <span className="text-hero-foreground/75 underline-offset-2 group-hover:underline">
                    Open in Google Maps
                  </span>
                </span>
              </a>
            </div>

            {/* 5 & 6. WhatsApp + Buy Ticket */}
            <div className="grid grid-cols-[1fr_auto] gap-2 sm:gap-3">
              <Button asChild variant="ticket" size="lg" className="h-14 text-lg lg:h-auto lg:px-7">
                <Link href="/tickets">
                  <Ticket className="size-6" /> Buy Tickets
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                className="h-14 bg-whatsapp px-5 text-white hover:bg-whatsapp/90 lg:h-auto"
              >
                <a
                  href={whatsappUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Chat with Park Vega on WhatsApp"
                >
                  <WhatsAppIcon className="size-6" />
                  <span className="hidden sm:inline lg:hidden xl:inline">WhatsApp</span>
                </a>
              </Button>
            </div>
          </div>
    </HeroCarousel>
  );
}
