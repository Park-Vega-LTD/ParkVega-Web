"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Play, UtensilsCrossed, Waves, X, type LucideIcon } from "lucide-react";
import { useState } from "react";

const foodImage = "/park-food.jpg";
const lazyRiverImage = "/lazy-river.jpg";
const heroImage = "/parkvega-hero.jpg";

// Paste the YouTube links here when they are ready, e.g.
// waterpark: "https://www.youtube.com/watch?v=VIDEO_ID"
// The play button then opens a full video player over the page.
const YOUTUBE_VIDEOS: { waterpark?: string; restaurants?: string } = {};

function toEmbedUrl(url: string) {
  const match = url.match(/(?:v=|youtu\.be\/|shorts\/|embed\/)([A-Za-z0-9_-]{6,})/);
  return match ? `https://www.youtube-nocookie.com/embed/${match[1]}?rel=0&autoplay=1` : url;
}

function VideoModal({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/90 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          aria-label="Close video"
          className="absolute -top-12 right-0 grid size-10 place-items-center rounded-full bg-background/15 text-background transition-colors hover:bg-background/25"
        >
          <X className="size-5" />
        </button>
        <div className="aspect-video w-full overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/20">
          <iframe
            src={toEmbedUrl(url)}
            title="Park Vega video"
            className="size-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
}

function WorldCard({
  image,
  videoImage,
  videoUrl,
  icon: Icon,
  title,
  description,
  to,
  cta,
  onPlay,
}: {
  image: string;
  videoImage: string;
  videoUrl: string | undefined;
  icon: LucideIcon;
  title: string;
  description: string;
  to: "/attractions" | "/restaurants";
  cta: string;
  onPlay: (url: string) => void;
}) {
  return (
    <div>
      <div className="relative">
        <div className="overflow-hidden rounded-3xl shadow-2xl ring-1 ring-background/15">
          <div className="relative aspect-[4/3] w-full">
            <Image
              src={image}
              alt={title}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover transition-transform duration-700 hover:scale-105"
            />
          </div>
        </div>
        <span className="absolute left-6 top-6 grid size-16 place-items-center rounded-full bg-card shadow-lg md:size-20">
          <Icon className="size-7 text-primary-ink md:size-9" />
        </span>
        <button
          type="button"
          onClick={() => {
            if (videoUrl) onPlay(videoUrl);
          }}
          disabled={!videoUrl}
          aria-label={videoUrl ? `Play ${title} video` : "Video coming soon"}
          className="absolute bottom-0 left-1/2 aspect-video w-[46%] max-w-[320px] -translate-x-1/2 translate-y-1/2 overflow-hidden rounded-2xl border-4 border-card bg-foreground shadow-2xl transition-transform duration-200 hover:scale-[1.03] disabled:cursor-default disabled:hover:scale-100"
        >
          <Image src={videoImage} alt="" fill sizes="(max-width: 768px) 46vw, 320px" className="object-cover" />
          <span className="absolute inset-0 grid place-items-center bg-foreground/20">
            <span className="grid size-11 place-items-center rounded-full bg-card/95 text-foreground">
              <Play className="ml-0.5 size-5 fill-current" />
            </span>
          </span>
          {!videoUrl && (
            <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-foreground/75 px-2 py-0.5 text-[10px] font-bold text-background">
              Video coming soon
            </span>
          )}
        </button>
      </div>
      <div className="mt-16 text-center">
        <h3 className="text-2xl font-semibold">{title}</h3>
        <p className="mx-auto mt-2 max-w-sm text-sm text-background/60">{description}</p>
        <Link href={to} className="group mt-5 inline-flex items-center gap-2 text-lg font-bold transition-colors hover:text-accent">
          {cta}
          <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  );
}

export function TwoWorlds() {
  const [video, setVideo] = useState<string | null>(null);

  return (
    <section className="bg-foreground py-24 text-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-balance text-[1.75rem] font-bold leading-tight sm:text-4xl">
            <span className="text-accent">Two worlds</span> under one roof?
          </h2>
          <p className="mt-2 text-2xl font-semibold sm:text-3xl">
            Only in <span className="text-accent">Park Vega</span>!
          </p>
        </div>
        <div className="mt-20 grid gap-x-8 gap-y-20 md:grid-cols-2">
          <WorldCard
            image={heroImage}
            videoImage={lazyRiverImage}
            videoUrl={YOUTUBE_VIDEOS.waterpark}
            icon={Waves}
            title="The Waterpark"
            description="Heart-racing drops, calm rivers and splash zones — a full day of water adventures for every age."
            to="/attractions"
            cta="Explore the waterpark"
            onPlay={setVideo}
          />
          <WorldCard
            image={foodImage}
            videoImage={foodImage}
            videoUrl={YOUTUBE_VIDEOS.restaurants}
            icon={UtensilsCrossed}
            title="Park Vega Eats"
            description="Jollof plates, burgers, pizza and cool drinks — real Nigerian flavour, steps from the slides."
            to="/restaurants"
            cta="Explore restaurants"
            onPlay={setVideo}
          />
        </div>
      </div>
      {video && <VideoModal url={video} onClose={() => setVideo(null)} />}
    </section>
  );
}
