"use client";

import { Play } from "lucide-react";
import { useState } from "react";

export type ParkVideo = { id: string; title: string };

/**
 * A vertical YouTube video that loads only when clicked. Until then it is a
 * lazy-loaded thumbnail with a play button, so the YouTube player (about 1 MB
 * of scripts per video) never slows down the page for visitors who don't watch.
 */
function VideoCard({ video }: { video: ParkVideo }) {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="relative aspect-[9/16] overflow-hidden rounded-3xl border border-border bg-deep shadow-[var(--shadow-card)]">
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
          <span className="absolute inset-0 bg-gradient-to-t from-deep/80 via-transparent to-deep/10" />
          <span className="absolute left-1/2 top-1/2 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-secondary text-secondary-foreground shadow-xl transition-transform duration-300 group-hover:scale-110">
            <Play className="size-7 translate-x-0.5 fill-current" aria-hidden="true" />
          </span>
          <span className="absolute inset-x-0 bottom-0 p-4 text-left font-display text-base font-semibold leading-snug text-hero-foreground sm:text-lg">
            {video.title}
          </span>
        </button>
      )}
    </div>
  );
}

export function VideoShorts({ videos }: { videos: ParkVideo[] }) {
  return (
    <div className="mx-auto grid max-w-2xl grid-cols-2 gap-3 sm:gap-6">
      {videos.map((video, i) => (
        <div key={video.id} data-reveal style={{ "--i": i } as React.CSSProperties}>
          <VideoCard video={video} />
        </div>
      ))}
    </div>
  );
}
