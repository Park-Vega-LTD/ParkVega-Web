"use client";

import { Pause, Play, Quote, Star } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

export type Testimonial = {
  quote: string;
  author: string;
  /** A short line under the name, e.g. "Birthday party, Asaba". */
  detail?: string;
  /** "1" to "5" stars, as staff pick it in the admin. */
  rating?: string;
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function stars(rating?: string) {
  const value = Number(rating);
  return Number.isInteger(value) && value >= 1 && value <= 5 ? value : 5;
}

export function TestimonialCard({ quote, author, detail, rating, className }: Testimonial & { className?: string }) {
  const count = stars(rating);
  return (
    <figure
      className={cn(
        "relative flex flex-col rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)]",
        className,
      )}
    >
      <Quote aria-hidden="true" className="absolute right-5 top-5 size-10 fill-ocean-soft text-ocean-soft" />
      <div className="flex gap-0.5" role="img" aria-label={`${count} out of 5 stars`}>
        {Array.from({ length: 5 }, (_, i) => (
          <Star key={i} className={cn("size-4", i < count ? "fill-accent text-accent" : "text-border")} />
        ))}
      </div>
      <blockquote className="relative mt-4 flex-1 text-sm leading-relaxed sm:text-[0.95rem]">“{quote}”</blockquote>
      <figcaption className="mt-5 flex items-center gap-3 border-t border-border pt-4">
        <span
          aria-hidden="true"
          className="grid size-10 shrink-0 place-items-center rounded-full bg-primary font-display text-sm font-bold text-primary-foreground"
        >
          {initials(author)}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-bold">{author}</span>
          <span className="block truncate text-xs text-muted-foreground">{detail?.trim() || "Park Vega guest"}</span>
        </span>
      </figcaption>
    </figure>
  );
}

/**
 * Guest testimonials on an endless track that slides from left to right.
 * It pauses on hover, on keyboard focus and with the Pause button (WCAG 2.2.2);
 * with reduced motion it is a still row you can swipe.
 */
export function TestimonialsCarousel({ testimonials }: { testimonials: Testimonial[] }) {
  const [paused, setPaused] = useState(false);
  // Short lists are repeated until one set is wider than the screen, then the
  // set is doubled so the loop is seamless when the track moves by half its width.
  const repeats = Math.max(1, Math.ceil(6 / Math.max(testimonials.length, 1)));
  const set = Array.from({ length: repeats }, () => testimonials).flat();

  return (
    <div className="group/marquee" data-paused={paused || undefined}>
      <div className="relative overflow-hidden py-4 [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)] motion-reduce:overflow-x-auto">
        <div className="marquee-right flex w-max">
          {[0, 1].map((copy) => (
            <ul
              key={copy}
              aria-hidden={copy === 1 || undefined}
              className={`flex gap-5 pr-5 ${copy === 1 ? "motion-reduce:hidden" : ""}`}
            >
              {set.map((testimonial, i) => (
                <li key={`${testimonial.author}-${i}`} aria-hidden={(copy === 0 && i >= testimonials.length) || undefined}>
                  <TestimonialCard {...testimonial} className="h-full w-[19rem] shrink-0 sm:w-[24rem]" />
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
      <div className="mx-auto mt-4 flex max-w-7xl justify-end px-4 motion-reduce:hidden sm:px-6">
        <button
          type="button"
          onClick={() => setPaused((value) => !value)}
          aria-pressed={paused}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-background px-4 text-sm font-semibold hover:border-primary hover:text-primary-ink"
        >
          {paused ? <Play className="size-4" /> : <Pause className="size-4" />}
          {paused ? "Play testimonials" : "Pause testimonials"}
        </button>
      </div>
    </div>
  );
}

/** A plain grid of testimonial cards, for landing pages. */
export function TestimonialsGrid({ testimonials }: { testimonials: Testimonial[] }) {
  return (
    <div className="grid gap-5 md:grid-cols-3">
      {testimonials.map((testimonial, i) => (
        <div key={`${testimonial.author}-${i}`} data-reveal className="card-lift rounded-3xl">
          <TestimonialCard {...testimonial} className="h-full" />
        </div>
      ))}
    </div>
  );
}
