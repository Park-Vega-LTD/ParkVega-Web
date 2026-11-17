"use client";

import { Play } from "lucide-react";
import { useState, type CSSProperties } from "react";

import { cn } from "@/lib/utils";

export type ParkVideo = {
  id: string;
  title: string;
  /** Short label on the round badge, e.g. "Wave pool". */
  badge?: string;
  tone?: "lime" | "coral" | "cyan";
};

/** Badge fill per tone. Brand fills carry Deep Ocean text for contrast (see globals.css). */
const BADGE: Record<NonNullable<ParkVideo["tone"]>, string> = {
  lime: "bg-secondary text-secondary-foreground",
  coral: "bg-coral text-deep",
  cyan: "bg-primary text-primary-foreground",
};

/**
 * A vertical YouTube video in a frosted-glass frame. The player loads only when
 * clicked; until then it is a lazy-loaded thumbnail with a play button, so the
 * YouTube player (about 1 MB of scripts per video) never slows down the page.
 */
function VideoCard({ video }: { video: ParkVideo }) {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="relative">
      {/* Glass frame around the video, as on a poster board. */}
      <div className="rounded-[1.75rem] border border-hero-foreground/40 bg-hero-foreground/15 p-1.5 shadow-[0_24px_48px_-20px_rgb(0_0_0/0.55)] backdrop-blur-md sm:p-2">
        <div className="relative aspect-[9/16] overflow-hidden rounded-[1.35rem] bg-deep">
          {playing ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&playsinline=1&rel=0`}
              title={video.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
              className="absolute inset-0 size-full"
            />
          ) : (
            <button
              type="button"
              onClick={() => setPlaying(true)}
              aria-label={`Play video: ${video.title}`}
              className="group absolute inset-0 size-full cursor-pointer"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- YouTube's own vertical thumbnail; lazy-loaded */}
              <img
                src={`https://i.ytimg.com/vi/${video.id}/oar2.jpg`}
                alt=""
                loading="lazy"
                decoding="async"
                className="absolute inset-0 size-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-deep/85 via-transparent to-transparent" />
              {/* Glass play button, bottom right */}
              <span className="absolute bottom-16 right-3 grid size-14 place-items-center rounded-full bg-hero-foreground/30 ring-1 ring-hero-foreground/50 backdrop-blur-md transition-[scale,background-color] duration-300 group-hover:scale-110 group-hover:bg-hero-foreground/45 sm:bottom-20 sm:right-4 sm:size-16">
                <span className="grid size-10 place-items-center rounded-full bg-hero-foreground text-deep sm:size-12">
                  <Play className="size-5 translate-x-0.5 fill-current" aria-hidden="true" />
                </span>
              </span>
              <span className="absolute inset-x-0 bottom-0 p-4 text-left font-display text-base font-semibold leading-snug text-hero-foreground sm:text-lg">
                {video.title}
              </span>
            </button>
          )}
        </div>
      </div>

      {video.badge && (
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute -left-3 top-8 grid size-20 place-items-center rounded-full p-2 text-center font-display text-sm font-bold leading-tight shadow-xl ring-4 ring-hero-foreground/30 sm:-left-6 sm:size-24 sm:text-base",
            BADGE[video.tone ?? "lime"],
          )}
        >
          {video.badge}
        </span>
      )}
    </div>
  );
}

export function VideoShorts({ videos }: { videos: readonly ParkVideo[] }) {
  return (
    <div className="mx-auto grid w-full max-w-xl grid-cols-2 gap-5 pl-3 sm:gap-8 sm:pl-6">
      {videos.map((video, i) => (
        // Every other card sits a little lower, for a staggered, poster-wall feel.
        <div key={video.id} data-reveal style={{ "--i": i } as CSSProperties} className={cn(i % 2 === 1 && "mt-10 sm:mt-14")}>
          <VideoCard video={video} />
        </div>
      ))}
    </div>
  );
}
