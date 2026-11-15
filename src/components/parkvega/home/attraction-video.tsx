"use client";

import { Play } from "lucide-react";

import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

/** The YouTube video ID in a youtube.com/watch, /shorts/ or youtu.be link, else null. */
function youTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/(?:shorts\/|watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/);
  return match ? match[1] : null;
}

/**
 * Play button over an attraction photo. Opens the attraction's video (a
 * YouTube link or an MP4 file such as a Cloudinary upload) in a dialog; the
 * player loads only when clicked, so the cards cost nothing extra to load.
 */
export function AttractionVideo({ url, name }: { url: string; name: string }) {
  const youTube = youTubeId(url);

  return (
    <Dialog>
      <DialogTrigger
        aria-label={`Play video: ${name}`}
        className="absolute inset-0 z-10 grid cursor-pointer place-items-center"
      >
        <span className="grid size-14 place-items-center rounded-full bg-secondary text-secondary-foreground shadow-xl ring-4 ring-white/40 transition-transform duration-300 group-hover:scale-110">
          <Play className="size-6 translate-x-0.5 fill-current" aria-hidden="true" />
        </span>
      </DialogTrigger>
      <DialogContent className="w-[min(92vw,26rem)] max-w-none gap-0 overflow-hidden border-0 bg-deep p-0 sm:rounded-3xl [&>button]:text-white [&>button]:opacity-90">
        <DialogTitle className="sr-only">{name}</DialogTitle>
        <div className="aspect-[9/16] max-h-[85svh] w-full">
          {youTube ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${youTube}?autoplay=1&playsinline=1&rel=0`}
              title={name}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
              className="size-full"
            />
          ) : (
            <video src={url} controls autoPlay playsInline className="size-full bg-black object-contain" />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
