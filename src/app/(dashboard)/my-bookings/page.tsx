import type { Metadata } from "next";

import { CustomerIdBadge } from "@/components/parkvega/account-gate";
import { MyTickets } from "@/components/parkvega/my-tickets";
import { serverFetch } from "@/lib/api.server";
import type { Booking, User } from "@/types/api";

// SSR: bookings are per-user and change after each purchase, so render on every
// request rather than caching (Requirement 10.1).
export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return {
    // Title: 36 chars (<= 60)
    title: "My Bookings | Park Vega Waterpark",
    // Description: 103 chars (<= 160)
    description:
      "View your Park Vega bookings—booking code, visit date, ticket type, total and status—all in one place.",
  };
}

export default async function MyBookingsPage() {
  // A failed fetch degrades to an empty list, which renders the empty-state
  // (link to /tickets) rather than crashing the dashboard.
  const [bookings, user] = await Promise.all([
    serverFetch<Booking[]>("/bookings", { cache: "no-store" }).catch(() => [] as Booking[]),
    serverFetch<User>("/users/me", { cache: "no-store" }).catch(() => null),
  ]);

  return (
    <section className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight">
          My Bookings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every ticket you&apos;ve booked with Park Vega.
        </p>
        <CustomerIdBadge id={user?.customer_id} className="mt-3" />
      </header>

      <MyTickets bookings={bookings} />
    </section>
  );
}
