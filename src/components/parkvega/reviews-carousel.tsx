"use client";

import { Pause, Play, Quote, Star } from "lucide-react";
import { useState } from "react";

import { REVIEWS } from "@/lib/home-content";

type Review = (typeof REVIEWS)[number];

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function ReviewCard({ quote, author }: Review) {
  return (
    <figure className="relative flex w-[19rem] shrink-0 flex-col rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)] sm:w-[24rem]">
      <Quote aria-hidden="true" className="absolute right-5 top-5 size-10 fill-ocean-soft text-ocean-soft" />
      <div className="flex gap-0.5 text-accent" aria-label="5 out of 5 stars">
        {Array.from({ length: 5 }, (_, i) => (
          <Star key={i} className="size-4 fill-current" />
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
          <span className="text-xs text-muted-foreground">Google review</span>
        </span>
      </figcaption>
    </figure>
  );
}

/**
 * Google review quotes on an endless track that slides from left to right.
 * It pauses on hover, on keyboard focus and with the Pause button (WCAG 2.2.2);
 * with reduced motion it is a still row you can swipe.
 */
export function ReviewsCarousel() {
  const [paused, setPaused] = useState(false);
  // The list is repeated so one set is always wider than the screen, then
  // doubled so the loop is seamless when the track moves by half its width.
  const set = [...REVIEWS, ...REVIEWS];

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
              {set.map((review, i) => (
                <li key={`${review.author}-${i}`} aria-hidden={(copy === 0 && i >= REVIEWS.length) || undefined}>
                  <ReviewCard {...review} />
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
          {paused ? "Play reviews" : "Pause reviews"}
        </button>
      </div>
    </div>
  );
}
