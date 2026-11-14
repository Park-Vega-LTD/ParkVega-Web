"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

type NetworkInformation = { saveData?: boolean; effectiveType?: string };

/**
 * For a Cloudinary upload with no transformation of its own, request a
 * compressed copy sized to the screen: about 2.5 MB on phones and 4 MB on
 * larger screens, instead of the full-size original. Other URLs are left as is.
 */
function sizedVideoUrl(src: string): string {
  const match = src.match(/^(https:\/\/res\.cloudinary\.com\/[^/]+\/video\/upload\/)(v\d+\/.+)$/);
  if (!match) return src;
  const width = window.innerWidth < 768 ? 720 : 960;
  return `${match[1]}q_auto:eco,w_${width}/${match[2]}`;
}

/**
 * Background autoplay video for the homepage billboard.
 *
 * The poster image is server-rendered underneath and is what paints first, so
 * the video is only mounted after hydration and faded in once it is actually
 * playing. It is skipped for visitors who prefer reduced motion or are on a
 * data-saver / 2G connection, where the still poster is the better experience.
 */
export function HeroVideo({ src }: { src: string }) {
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
    const slowNetwork = connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType ?? "");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Defer by a frame so mounting the video never competes with first paint.
    if (slowNetwork || reducedMotion) return;
    const id = requestAnimationFrame(() => setVideoSrc(sizedVideoUrl(src)));
    return () => cancelAnimationFrame(id);
  }, [src]);

  if (!videoSrc) return null;

  return (
    <video
      src={videoSrc}
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
