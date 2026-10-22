import type { Metadata } from "next";
import { CalendarClock, CloudSun } from "lucide-react";

import { EventCard } from "@/components/parkvega/event-card";
import { FaqBlock } from "@/components/parkvega/faq-block";
import { SectionHeading } from "@/components/parkvega/page-hero";
import { JsonLd } from "@/components/parkvega/json-ld";
import { publicFetch } from "@/lib/api.server";
import { EventCalendar } from "@/components/parkvega/event-calendar";
import { getExtraOpenDates, getFromPrice } from "@/lib/public-data";
import { eventSchemas } from "@/lib/schema";
import type { Event, EventSession } from "@/types/api";

// ISR: regenerate the events page at most once every 60 seconds (Requirement 4.1).
export const revalidate = 60;

export const metadata: Metadata = {
  // Title: 44 chars (<= 60)
  title: "Events | Park Vega Waterpark in Agbor",
  // Description: 139 chars (<= 160)
  description:
    "See upcoming Park Vega events and special park days in Agbor, Delta State. Check session availability and book your tickets before they sell out.",
  openGraph: {
    title: "Events | Park Vega Waterpark in Agbor",
    description:
      "Upcoming events, celebrations and special park days at Park Vega in Agbor, Delta State.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Events | Park Vega Waterpark in Agbor",
    description:
      "Upcoming events, celebrations and special park days at Park Vega in Agbor, Delta State.",
  },
};

const fetchOpts = { next: { revalidate: 60 } } as const;

/** Shape returned by the per-session availability endpoint. */
type SessionAvailability = Pick<EventSession, "id" | "seats_available">;

/**
 * Fetch live availability for a single session. The endpoint returns the
 * current seat count, which can be fresher than the count embedded in the
 * event payload. On failure we fall back to the embedded `seats_available`
 * so the page still renders a sensible status.
 */
async function fetchSeatsAvailable(session: EventSession): Promise<number> {
  const availability = await publicFetch<SessionAvailability>(
    `/events/sessions/${session.id}/availability`,
    fetchOpts,
  ).catch(() => null);

  return availability?.seats_available ?? session.seats_available;
}

/** A session is available when it still has seats; otherwise it is sold out. */
function isAvailable(seatsAvailable: number): boolean {
  return seatsAvailable > 0;
}

/** Format a session date + time for display in the availability list. */
function formatSession(session: EventSession): string {
  const date = new Date(session.session_date).toLocaleDateString("en-NG", {
    dateStyle: "medium",
  });
  return session.start_time ? `${date} · ${session.start_time}` : date;
}

export default async function EventsPage() {
  // Fetch all events (each event includes its sessions). A failure degrades to
  // an empty list so the page still renders an empty-state (match homepage).
  const [events, fromPrice, extraOpenDates] = await Promise.all([
    publicFetch<Event[]>("/events", fetchOpts).catch(() => [] as Event[]),
    getFromPrice(),
    getExtraOpenDates(),
  ]);
  const today = new Date().toISOString().slice(0, 10);

  // Only surface events that are visible to the public (published).
  const visibleEvents = events.filter((event) => event.status === "PUBLISHED");

  // Fetch live availability for every visible session in parallel, then build a
  // lookup of sessionId -> seats_available for rendering the status badges.
  const visibleSessions = visibleEvents.flatMap(
    (event) => event.sessions ?? [],
  );
  const seatsEntries = await Promise.all(
    visibleSessions.map(
      async (session) =>
        [session.id, await fetchSeatsAvailable(session)] as const,
    ),
  );
  const seatsBySessionId = new Map<string, number>(seatsEntries);

  return (
    <>
      {/* Event schema is generated from the same API data marketing edits, so it never drifts. */}
      {eventSchemas(visibleEvents, fromPrice, today).map((schema, index) => (
        <JsonLd key={index} data={schema} />
      ))}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
        <SectionHeading
          eyebrow="Save the date"
          title="What's coming up at the park."
          description="Special park days, celebrations and family experiences worth marking in your calendar. Check each session's availability and grab your tickets early."
        />

        <div className="mt-10">
        <EventCalendar events={visibleEvents} extraOpenDates={extraOpenDates} />
      </div>

      {visibleEvents.length > 0 ? (
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {visibleEvents.map((event) => {
              const sessions = [...(event.sessions ?? [])].sort((a, b) =>
                a.session_date.localeCompare(b.session_date),
              );

              return (
                <div key={event.id} id={`event-${event.id}`} className="flex scroll-mt-24 flex-col gap-4">
                  <EventCard event={event} />

                  {sessions.length > 0 && (
                    <div className="rounded-3xl border border-border bg-card p-5">
                      <span className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground">
                        <CalendarClock className="size-4 text-primary-ink" />
                        Sessions
                      </span>
                      <ul className="mt-3 space-y-2">
                        {sessions.map((session) => {
                          const seatsAvailable =
                            seatsBySessionId.get(session.id) ??
                            session.seats_available;
                          const available = isAvailable(seatsAvailable);
                          return (
                            <li
                              key={session.id}
                              className="flex items-center justify-between gap-3 text-sm"
                            >
                              <span className="text-muted-foreground">
                                {formatSession(session)}
                              </span>
                              <span
                                className={
                                  available
                                    ? "rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary-ink"
                                    : "rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground"
                                }
                              >
                                {available ? "Available" : "Sold out"}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-10 rounded-3xl border border-border bg-card p-10 text-center shadow-lg">
            <CloudSun className="mx-auto size-10 text-primary-ink" />
            <h3 className="mt-5 text-2xl font-semibold">
              Fresh dates are on the way.
            </h3>
            <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
              No events have been announced yet. Follow Park Vega&apos;s official
              channels so you never miss the next announcement.
            </p>
          </div>
        )}
      </section>
      <FaqBlock extra={[
          ["Is Park Vega open on public holidays?", "Yes. Park Vega opens on public holidays as well as every Thursday, Friday, Saturday and Sunday, from 11am to 6pm."],
        ]} />
    </>
  );
}
