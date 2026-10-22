import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { categoryOf } from "@/lib/events";
import type { Event } from "@/types/api";

export function EventCard({ event }: { event: Event }) {
  const nextSession = [...event.sessions].sort((a, b) =>
    a.session_date.localeCompare(b.session_date),
  )[0];

  const dateLabel = nextSession
    ? new Date(nextSession.session_date).toLocaleDateString("en-NG", { dateStyle: "long" })
    : "Date to be announced";

  return (
    <article className="overflow-hidden rounded-3xl border border-border bg-card">
      {event.image_url && (
        <div className="relative aspect-[4/3] w-full">
          <Image
            src={event.image_url}
            alt={event.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover"
          />
        </div>
      )}
      <div className="p-7">
        <span className={`mb-3 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ${categoryOf(event).className}`}>
          {categoryOf(event).label}
        </span>
        <span className="block text-xs font-bold uppercase text-primary-ink">
          {dateLabel}
          {nextSession?.start_time && ` · ${nextSession.start_time}`}
        </span>
        <h2 className="mt-2 text-2xl font-semibold">{event.title}</h2>
        {event.description && <p className="mt-3 text-sm text-muted-foreground">{event.description}</p>}
        <Button asChild variant="ticket" size="sm" className="mt-5">
          <Link href="/tickets">Buy Tickets</Link>
        </Button>
      </div>
    </article>
  );
}
