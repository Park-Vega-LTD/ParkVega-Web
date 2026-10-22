import Image from "next/image";
import Link from "next/link";
import { CalendarDays, MapPin, Ticket } from "lucide-react";

import { HeroVideo } from "@/components/parkvega/home/hero-video";
import { Logo } from "@/components/parkvega/logo";
import { WhatsAppIcon } from "@/components/parkvega/whatsapp-icon";
import { Button } from "@/components/ui/button";
import { MAPS_URL, TOWN, formatNaira, shortDays, whatsappUrl } from "@/lib/site";
import type { SiteSettings } from "@/types/api";

const DEFAULT_HERO_IMAGE = "/parkvega-hero.jpg";

/**
 * Above-the-fold homepage billboard. Per the brief it shows only six things:
 * the autoplay video, the starting ticket price, opening days, the location
 * pin, a WhatsApp button and the Buy Ticket button. No menus, no slider.
 */
export function Billboard({
  fromPrice,
  settings,
}: {
  fromPrice: number;
  settings: Pick<SiteSettings, "opening_days" | "opening_hours" | "hero_video_url" | "hero_image_url">;
}) {
  const heroImage = settings.hero_image_url || DEFAULT_HERO_IMAGE;
  return (
    <section
      data-billboard
      aria-label="Park Vega Waterpark at a glance"
      className="relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-deep text-hero-foreground"
    >
      <Image
        src={heroImage}
        alt="Families enjoying the wave pool and water slides at Park Vega Waterpark"
        fill
        preload
        sizes="100vw"
        className="-z-20 object-cover"
      />
      {settings.hero_video_url && (
        <div className="absolute inset-0 -z-20">
          <HeroVideo src={settings.hero_video_url} />
        </div>
      )}
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-deep via-deep/45 to-deep/30" />

      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 pb-5 pt-5 sm:px-6 sm:pb-8">
        <Link href="/" className="w-fit" aria-label="Park Vega Waterpark home">
          <Logo tone="onDark" size="lg" />
        </Link>

        <div className="mt-auto pt-10">
          {/* The logo above carries the name, so the headline leads with the promise. */}
          <h1 className="font-display drop-shadow-lg">
            <span className="block text-base font-semibold uppercase tracking-wider text-secondary sm:text-lg">
              Park Vega Waterpark · Agbor
            </span>
            <span className="mt-1 block text-[clamp(2.25rem,6.5vw,4.5rem)] font-bold leading-[1.02]">
              Delivering your kind of fun
            </span>
          </h1>

          <div className="mt-6 grid gap-2 sm:mt-8 sm:gap-3 lg:grid-cols-[1fr_1.4fr_1fr_minmax(16rem,auto)] lg:items-stretch">
            {/* 2. Ticket price */}
            <div className="rounded-2xl bg-hero-foreground px-5 py-3 text-foreground shadow-xl lg:py-4">
              <span className="block text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
                Tickets from
              </span>
              <span className="block font-display text-4xl font-extrabold leading-none sm:text-5xl">
                {formatNaira(fromPrice)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:contents">
              {/* 3. Opening days */}
              <div className="flex items-start gap-3 rounded-2xl border border-hero-foreground/25 bg-deep/55 p-3 backdrop-blur-md sm:p-4">
                <CalendarDays className="mt-0.5 size-5 shrink-0 text-secondary" />
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
                className="group flex items-start gap-3 rounded-2xl border border-hero-foreground/25 bg-deep/55 p-3 backdrop-blur-md hover:bg-deep/75 sm:p-4"
              >
                <MapPin className="mt-0.5 size-5 shrink-0 text-secondary" />
                <span className="text-sm leading-snug">
                  <span className="block font-bold">{TOWN}</span>
                  <span className="text-hero-foreground/75 underline-offset-2 group-hover:underline">
                    Open in Google Maps
                  </span>
                </span>
              </a>
            </div>

            {/* 5 & 6. WhatsApp + Buy Ticket */}
            <div className="grid grid-cols-[1fr_auto] gap-2 sm:gap-3 lg:grid-cols-1">
              <Button asChild variant="ticket" size="lg" className="h-16 text-lg lg:h-auto lg:min-h-16 lg:text-xl">
                <Link href="/tickets">
                  <Ticket className="size-6" /> Buy Tickets
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                className="h-16 bg-whatsapp px-5 text-white hover:bg-whatsapp/90 lg:h-12"
              >
                <a
                  href={whatsappUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Chat with Park Vega on WhatsApp"
                >
                  <WhatsAppIcon className="size-6" />
                  <span className="hidden sm:inline">WhatsApp</span>
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
