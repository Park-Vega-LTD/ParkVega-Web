"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import { HeroVideo } from "@/components/parkvega/home/hero-video";
import { cn } from "@/lib/utils";

/** `position` is a CSS object-position for photos whose subject sits off-centre (e.g. "50% 25%"). */
export type HeroSlide = { image: string; alt: string; eyebrow: string; headline: string; position?: string };

const INTERVAL_MS = 6500;

/**
 * Homepage billboard carousel: full-bleed photos that crossfade on a timer,
 * each with its own headline. `children` (price, hours, ticket buttons) stays
 * put across slides. Autoplay stops on hover, keyboard focus, a hidden tab or
 * the pause button, and never starts for visitors who prefer reduced motion.
 */
export function HeroCarousel({
  slides,
  videoUrl,
  logo,
  children,
}: {
  slides: HeroSlide[];
  /** Plays behind the first slide in place of its photo once it loads. */
  videoUrl?: string | null;
  logo: ReactNode;
  children: ReactNode;
}) {
  const [index, setIndex] = useState(0);
  // The first headline paints straight away (it is the LCP text); later ones animate in.
  const [changed, setChanged] = useState(false);
  const [paused, setPaused] = useState(false);
  const [held, setHeld] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const touchX = useRef<number | null>(null);
  const count = slides.length;

  const show = useCallback((next: number) => { setChanged(true); setIndex(next); }, []);
  const go = useCallback((step: number) => { setChanged(true); setIndex((current) => (current + step + count) % count); }, [count]);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(query.matches);
    const onChange = () => setReducedMotion(query.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (count < 2 || paused || held || reducedMotion) return;
    const timer = window.setTimeout(() => { if (!document.hidden) go(1); }, INTERVAL_MS);
    return () => window.clearTimeout(timer);
  }, [index, count, paused, held, reducedMotion, go]);

  const slide = slides[index];

  return (
    <section
      data-billboard
      aria-roledescription="carousel"
      aria-label="Park Vega Waterpark at a glance"
      className="relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-deep text-hero-foreground"
      onMouseEnter={() => setHeld(true)}
      onMouseLeave={() => setHeld(false)}
      onFocusCapture={() => setHeld(true)}
      onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setHeld(false); }}
      onTouchStart={(event) => { touchX.current = event.touches[0].clientX; }}
      onTouchEnd={(event) => {
        if (touchX.current === null) return;
        const dx = event.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
      }}
    >
      {slides.map((item, i) => (
        <div
          key={item.image}
          data-hero-slide
          data-active={changed && i === index ? "" : undefined}
          aria-hidden={i !== index}
          className={cn("absolute inset-0 -z-20 overflow-hidden transition-opacity duration-1000 ease-out", i === index ? "opacity-100" : "opacity-0")}
        >
          <Image src={item.image} alt={item.alt} fill preload={i === 0} sizes="100vw" className="object-cover" style={item.position ? { objectPosition: item.position } : undefined} />
          {i === 0 && videoUrl && <HeroVideo src={videoUrl} />}
        </div>
      ))}
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-deep via-deep/45 to-deep/30" />

      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 pb-5 pt-5 sm:px-6 sm:pb-8">
        {logo}

        <div className="mt-auto pt-10">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            {/* Keyed by slide so the words animate in again on every change. */}
            <h1 key={index} data-hero-copy={changed ? "" : undefined} aria-live={paused || reducedMotion ? "polite" : "off"} className="font-display drop-shadow-lg">
              <span className="block text-base font-semibold uppercase tracking-wider text-secondary sm:text-lg">
                {slide.eyebrow}
              </span>
              <span className="mt-1 block text-[clamp(2.25rem,6.5vw,4.5rem)] font-bold leading-[1.02]">
                {slide.headline}
              </span>
            </h1>

            {count > 1 && (
              <div className="flex shrink-0 items-center gap-2">
                <button type="button" onClick={() => go(-1)} aria-label="Previous slide" className="grid size-11 place-items-center rounded-full border border-hero-foreground/30 bg-deep/40 backdrop-blur-md hover:bg-deep/70">
                  <ChevronLeft className="size-5" aria-hidden="true" />
                </button>
                <div className="flex items-center gap-1.5 px-1">
                  {slides.map((item, i) => (
                    <button
                      key={item.image}
                      type="button"
                      onClick={() => show(i)}
                      aria-label={`Slide ${i + 1} of ${count}: ${item.eyebrow}`}
                      aria-current={i === index ? "true" : undefined}
                      className="grid h-11 place-items-center"
                    >
                      <span className={cn("block h-2 rounded-full transition-all duration-300", i === index ? "w-8 bg-secondary" : "w-2 bg-hero-foreground/50 hover:bg-hero-foreground/80")} />
                    </button>
                  ))}
                </div>
                <button type="button" onClick={() => go(1)} aria-label="Next slide" className="grid size-11 place-items-center rounded-full border border-hero-foreground/30 bg-deep/40 backdrop-blur-md hover:bg-deep/70">
                  <ChevronRight className="size-5" aria-hidden="true" />
                </button>
                {!reducedMotion && (
                  <button type="button" onClick={() => setPaused((value) => !value)} aria-label={paused ? "Play slideshow" : "Pause slideshow"} className="grid size-11 place-items-center rounded-full border border-hero-foreground/30 bg-deep/40 backdrop-blur-md hover:bg-deep/70">
                    {paused ? <Play className="size-4" aria-hidden="true" /> : <Pause className="size-4" aria-hidden="true" />}
                  </button>
                )}
              </div>
            )}
          </div>

          {children}
        </div>
      </div>
    </section>
  );
}
