"use client";

import Image from "next/image";
import Link from "next/link";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { Ticket as TicketIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatNaira } from "@/lib/utils";
import type { Booking } from "@/types/api";

const KEY = "pv-tickets";

export function rememberTicket(code: string) {
  try {
    const list: string[] = JSON.parse(localStorage.getItem(KEY) || "[]");
    localStorage.setItem(KEY, JSON.stringify([code, ...list.filter((c) => c !== code)].slice(0, 5)));
  } catch { /* storage unavailable */ }
}

/** Maps a booking status to a Badge variant + human-readable label. */
const STATUS_META: Record<
  Booking["status"],
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  reserved: { label: "Reserved", variant: "secondary" },
  pending_payment: { label: "Pending payment", variant: "outline" },
  paid: { label: "Paid", variant: "default" },
  checked_in: { label: "Checked in", variant: "default" },
  cancelled: { label: "Cancelled", variant: "destructive" },
};

function formatVisitDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-NG", {
    weekday: "short",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Booking history list.
 *
 * When `bookings` is provided (the `/my-bookings` dashboard page), it renders
 * each booking's code, visit date, ticket type, total price, and status
 * (Requirement 10.1), with an empty-state link to `/tickets` when the list is
 * empty. When `bookings` is omitted, it falls back to the device-local recent
 * tickets view (QR codes stored in `localStorage`).
 */
export function MyTickets({ bookings }: { bookings?: Booking[] }) {
  if (bookings !== undefined) {
    if (bookings.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <TicketIcon className="size-10 text-primary-ink" aria-hidden="true" />
          <h2 className="mt-4 text-lg font-semibold">No bookings yet</h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            You haven&apos;t booked any tickets yet. Grab your passes and start
            planning your splash day.
          </p>
          <Button asChild className="mt-6">
            <Link href="/tickets">Buy Tickets</Link>
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {bookings.map((booking) => {
          const status = STATUS_META[booking.status] ?? {
            label: booking.status,
            variant: "secondary" as const,
          };
          return (
            <Card key={booking.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                <div>
                  <CardTitle className="font-mono text-lg">
                    {booking.code}
                  </CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatVisitDate(booking.visit_date)}
                  </p>
                </div>
                <Badge variant={status.variant}>{status.label}</Badge>
              </CardHeader>
              <CardContent className="flex flex-wrap items-end justify-between gap-4">
                <dl className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Ticket type</dt>
                    <dd className="font-medium">
                      {booking.ticket_name ?? "General admission"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Total</dt>
                    <dd className="font-semibold">{formatNaira(booking.total)}</dd>
                  </div>
                </dl>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/booking/${booking.code}`}>View ticket</Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }

  return <RecentDeviceTickets />;
}

/** Device-local recent tickets view (QR codes from `localStorage`). */
function RecentDeviceTickets() {
  const [items, setItems] = useState<{ code: string; qr: string }[]>([]);
  useEffect(() => {
    let codes: string[] = [];
    try { codes = JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { /* ignore */ }
    Promise.all(codes.map(async (code) => ({ code, qr: await QRCode.toDataURL(code, { width: 200, margin: 1 }) }))).then(setItems);
  }, []);
  if (!items.length) return null;
  return (
    <section className="mx-auto max-w-7xl px-4 pb-4 pt-10 sm:px-6">
      <h2 className="text-2xl font-semibold">Your tickets</h2>
      <p className="text-sm text-muted-foreground">Tickets booked on this device. Show the QR code at the gate.</p>
      <div className="mt-4 flex gap-4 overflow-x-auto pb-2">
        {items.map((t) => (
          <Link key={t.code} href={`/booking/${t.code}`} className="shrink-0 rounded-3xl border border-border bg-card p-4 text-center shadow-sm">
            <Image
              src={t.qr}
              alt={`QR code for ticket ${t.code}`}
              width={200}
              height={200}
              unoptimized
              className="mx-auto size-32 rounded-xl"
            />
            <p className="mt-2 font-mono text-sm font-bold">{t.code}</p>
            <p className="text-xs text-primary-ink">Open ticket</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
