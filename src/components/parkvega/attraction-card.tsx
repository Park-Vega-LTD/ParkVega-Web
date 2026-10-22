import Image from "next/image";
import Link from "next/link";
import { Gauge, Ruler, ShieldCheck, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Attraction } from "@/types/api";

const FALLBACK_IMAGE = "/parkvega-hero.jpg";

export function AttractionCard({ attraction }: { attraction: Attraction }) {
  const badge = attraction.thrill_level ? `${attraction.thrill_level} thrill` : attraction.category;
  const details = [
    attraction.who_it_suits ? `Suits: ${attraction.who_it_suits}` : null,
    attraction.thrill_level ? `Thrill level: ${attraction.thrill_level}` : "Ask our team",
    attraction.height_requirement ? `Height: ${attraction.height_requirement}` : "Height guidance at entrance",
    "Lifeguard supervised",
  ];
  const detailIcons = [Users, Gauge, Ruler, ShieldCheck];

  return (
    <article className="overflow-hidden rounded-3xl border border-border bg-card">
      <div className="relative aspect-[4/3] w-full">
        <Image
          src={attraction.image_url || FALLBACK_IMAGE}
          alt={attraction.name}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover"
        />
      </div>
      <div className="p-6">
        <span className="text-xs font-extrabold uppercase text-primary-ink">{badge}</span>
        <h2 className="mt-2 text-2xl font-semibold">{attraction.name}</h2>
        {attraction.description && (
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{attraction.description}</p>
        )}
        <ul className="mt-5 grid gap-3 text-sm">
          {details.map((detail, index) => {
            if (!detail) return null;
            const Icon = detailIcons[index] ?? ShieldCheck;
            return (
              <li key={detail} className="flex items-center gap-2">
                <Icon className="size-4 text-primary-ink" />
                {detail}
              </li>
            );
          })}
        </ul>
        <Button asChild variant="outline" className="mt-6 w-full">
          <Link href={`/attractions/${attraction.id}`}>View details</Link>
        </Button>
      </div>
    </article>
  );
}
