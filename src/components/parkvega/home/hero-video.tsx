"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

type NetworkInformation = { saveData?: boolean; effectiveType?: string };

/**
 * Background autoplay video for the homepage billboard.
 *
 * The poster image is server-rendered underneath and is what paints first, so
 * the video is only mounted after hydration and faded in once it is actually
 * playing. It is skipped for visitors who prefer reduced motion or are on a
 * data-saver / 2G connection, where the still poster is the better experience.
 */
export function HeroVideo({ src }: { src: string }) {
  const [enabled, setEnabled] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
    const slowNetwork = connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType ?? "");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Defer by a frame so mounting the video never competes with first paint.
    const id = requestAnimationFrame(() => setEnabled(!slowNetwork && !reducedMotion));
    return () => cancelAnimationFrame(id);
  }, []);

  if (!enabled) return null;

  return (
    <video
      src={src}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      aria-hidden="true"
      onPlaying={() => setPlaying(true)}
      className={cn(
        "absolute inset-0 size-full object-cover transition-opacity duration-700",
        playing ? "opacity-100" : "opacity-0",
      )}
    />
  );
}
