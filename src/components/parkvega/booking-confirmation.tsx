"use client";

import Link from "next/link";
import QRCode from "qrcode";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  Ban,
  CalendarCheck,
  Check,
  CheckCircle2,
  Copy,
  DoorOpen,
  Loader2,
  MapPin,
  Navigation,
  Printer,
  Shirt,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { WhatsAppButton } from "@/components/parkvega/whatsapp-button";
import { Button } from "@/components/ui/button";
import { clientFetch } from "@/lib/api.client";
import { MAPS_URL, OPEN_DAYS_LONG, OPEN_HOURS } from "@/lib/site";
import { formatNaira } from "@/lib/utils";
import { WHAT_TO_WEAR } from "@/lib/visit-content";
import type { Booking, Ticket } from "@/types/api";

/**
 * Post-purchase confirmation (client brief §6b): booking reference, ticket
 * details and QR codes, validity, entry instructions, what to wear and a
 * Google Maps link. It is public so guests who bought without an account can
 * open it straight from the Flutterwave redirect or their WhatsApp / email
 * confirmation; the booking code in the URL is the access key.
 */

/** Message the BFF proxy returns on a 401 after a failed refresh. */
const SESSION_EXPIRED_MESSAGE = "Session expired. Please log in again.";

const CATEGORY_LABELS: Record<Ticket["visitor_category"], string> = {
  ADULT: "Adult",
  CHILD: "Child",
  INFANT: "Infant",
};

const ENTRY_STEPS = [
  "Show the QR code for each guest at the gate – on this page, or from your WhatsApp or email confirmation.",
  "Each QR code admits one guest, once, on your visit date.",
  "Children under 150cm must be with an adult throughout the visit.",
  "Pick up life jackets for non-swimmers from staff before you swim.",
];

function formatVisitDate(value: string): string {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return value;
  return new Date(year, month - 1, day).toLocaleDateString("en-NG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** Last four digits only, so the page never shows a full phone number. */
function maskPhone(phone: string | null) {
  return phone ? `••••${phone.replace(/\D/g, "").slice(-4)}` : null;
}

function TicketQr({ ticket }: { ticket: Ticket }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    QRCode.toCanvas(canvas, ticket.ticket_code, { width: 200, margin: 1 }).catch(() => {
      /* rendering failed — leave canvas blank */
    });
  }, [ticket.ticket_code]);

  return (
    <div className="flex flex-col items-center rounded-3xl border border-border bg-card p-4 text-center">
      <canvas
        ref={canvasRef}
        className="size-48 rounded-xl"
        role="img"
        aria-label={`QR code for ticket ${ticket.ticket_code}`}
      />
      <p className="mt-3 font-mono text-sm font-bold">{ticket.ticket_code}</p>
      <p className="text-xs text-muted-foreground">{CATEGORY_LABELS[ticket.visitor_category]}</p>
    </div>
  );
}

function CopyReference({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(code).then(() => {
          setCopied(true);
          window.setTimeout(() => setCopied(false), 2000);
        }).catch(() => undefined);
      }}
      className="inline-flex items-center gap-1.5 rounded-full border border-hero-foreground/30 px-3 py-1 text-xs font-semibold hover:bg-hero-foreground/10 print:hidden"
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function StatusBanner({ booking, onPay, paying, payError }: {
  booking: Booking;
  onPay: () => void;
  paying: boolean;
  payError: string | null;
}) {
  const firstName = booking.full_name.split(" ")[0];
  switch (booking.status) {
    case "paid":
    case "checked_in":
      return (
        <div className="flex items-start gap-3">
          <CheckCircle2 className="size-9 shrink-0 text-secondary" />
          <div>
            <h1 className="text-3xl font-semibold sm:text-4xl">You&apos;re all set, {firstName}!</h1>
            <p className="mt-1 text-hero-foreground/75">
              {booking.status === "checked_in" ? "Checked in – enjoy your day!" : "Payment received. Your tickets are below."}
            </p>
          </div>
        </div>
      );
    case "pending_payment":
      return (
        <div className="flex items-start gap-3" role="status" aria-live="polite">
          <Loader2 className="size-9 shrink-0 animate-spin text-secondary" />
          <div>
            <h1 className="text-3xl font-semibold sm:text-4xl">Confirming your payment…</h1>
            <p className="mt-1 text-hero-foreground/75">This page updates automatically – it usually takes under a minute.</p>
          </div>
        </div>
      );
    case "reserved":
      return (
        <div>
          <h1 className="text-3xl font-semibold sm:text-4xl">Almost there, {firstName}</h1>
          <p className="mt-1 text-hero-foreground/75">Complete your payment to receive your tickets.</p>
          <Button variant="ticket" size="lg" className="mt-5" onClick={onPay} disabled={paying}>
            {paying && <Loader2 className="size-5 animate-spin" />}
            {paying ? "Redirecting…" : `Pay ${formatNaira(booking.total)}`}
          </Button>
          {payError && <p className="mt-3 text-sm font-semibold text-accent" role="alert">{payError}</p>}
        </div>
      );
    case "cancelled":
      return (
        <div className="flex items-start gap-3">
          <Ban className="size-9 shrink-0 text-accent" />
          <div>
            <h1 className="text-3xl font-semibold sm:text-4xl">Booking cancelled</h1>
            <p className="mt-1 text-hero-foreground/75">No tickets are valid for entry on this booking.</p>
          </div>
        </div>
      );
  }
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      {children}
    </div>
  );
}

export function BookingConfirmation({ code }: { code: string }) {
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  const bookingQuery = useQuery<Booking>({
    queryKey: ["bookings", code],
    queryFn: () => clientFetch<Booking>(`/api/bookings/${code}`),
    // Poll every 10s while payment is being confirmed (Requirements 8.3, 15.4).
    refetchInterval: (query) => (query.state.data?.status === "pending_payment" ? 10_000 : false),
    retry: false,
  });
  const booking = bookingQuery.data;
  const paid = booking?.status === "paid" || booking?.status === "checked_in";

  const ticketsQuery = useQuery<Ticket[]>({
    queryKey: ["tickets", booking?.id],
    queryFn: () => clientFetch<Ticket[]>(`/api/bookings/${booking?.id}/tickets`),
    enabled: Boolean(booking?.id) && paid,
    retry: false,
  });

  async function payNow() {
    if (!booking) return;
    setPaying(true);
    setPayError(null);
    try {
      const { authorization_url } = await clientFetch<{ authorization_url: string }>("/api/payments/initiate", {
        method: "POST",
        body: JSON.stringify({ bookingId: booking.id }),
      });
      window.location.href = authorization_url;
    } catch (err) {
      setPayError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setPaying(false);
    }
  }

  if (bookingQuery.isPending) {
    return (
      <Centered>
        <Loader2 className="size-8 animate-spin text-primary-ink" aria-hidden="true" />
        <p className="text-sm text-muted-foreground" role="status">Loading your booking…</p>
      </Centered>
    );
  }

  if (bookingQuery.error || !booking) {
    const message = bookingQuery.error?.message ?? "";
    const notFound = /not found|404/i.test(message);
    const authRequired = message === SESSION_EXPIRED_MESSAGE || /unauth/i.test(message);
    return (
      <Centered>
        <AlertCircle className="size-10 text-destructive" aria-hidden="true" />
        <h1 className="text-xl font-semibold">
          {notFound ? "We couldn't find that booking" : "We couldn't load your booking"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {notFound
            ? `Check the reference ${code}, or open the link in your WhatsApp or email confirmation.`
            : authRequired
              ? "Your tickets are in your WhatsApp and email confirmation. Sign in to see them here."
              : "Something went wrong while fetching your booking. Please try again."}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {authRequired ? (
            <Button asChild>
              <Link href={`/login?next=${encodeURIComponent(`/booking/${code}`)}`}>Sign in</Link>
            </Button>
          ) : (
            !notFound && <Button onClick={() => bookingQuery.refetch()}>Try again</Button>
          )}
          <WhatsAppButton variant="outline" message={`Hi Park Vega! I need help with booking ${code}.`}>
            Get help
          </WhatsAppButton>
        </div>
      </Centered>
    );
  }

  const tickets = ticketsQuery.data ?? [];
  const sentTo = [maskPhone(booking.phone) && `WhatsApp (${maskPhone(booking.phone)})`, booking.email && "email"]
    .filter(Boolean)
    .join(" and ");

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="rounded-3xl bg-deep p-6 text-hero-foreground sm:p-8">
        <StatusBanner booking={booking} onPay={payNow} paying={paying} payError={payError} />
        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-hero-foreground/15 pt-5">
          <span className="text-xs font-bold uppercase text-hero-foreground/60">Booking reference</span>
          <span className="font-mono text-2xl font-bold tracking-wider">{booking.code}</span>
          <CopyReference code={booking.code} />
        </div>
        {booking.customer_id && (
          <p className="mt-2 text-sm text-hero-foreground/75">
            Customer ID <span className="font-mono font-semibold text-hero-foreground">{booking.customer_id}</span>
          </p>
        )}
        {paid && sentTo && (
          <p className="mt-3 text-sm text-hero-foreground/75">A copy of this confirmation has been sent to your {sentTo}.</p>
        )}
      </div>

      <section aria-labelledby="details-title" className="mt-6 rounded-3xl border border-border bg-card p-6">
        <h2 id="details-title" className="text-lg font-semibold">Ticket details</h2>
        <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <div className="col-span-2">
            <dt className="text-muted-foreground">Visit date</dt>
            <dd className="font-semibold">{formatVisitDate(booking.visit_date)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Ticket</dt>
            <dd className="font-semibold">{booking.ticket_name ?? "Day ticket"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Guests</dt>
            <dd className="font-semibold">
              {booking.adults} adult{booking.adults === 1 ? "" : "s"}
              {booking.children > 0 && `, ${booking.children} child${booking.children === 1 ? "" : "ren"}`}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Name</dt>
            <dd className="font-semibold">{booking.full_name}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Total</dt>
            <dd className="font-semibold">{formatNaira(booking.total)}</dd>
          </div>
        </dl>
        <div className="mt-5 flex items-start gap-3 rounded-2xl bg-ocean-soft p-4 text-sm">
          <CalendarCheck className="mt-0.5 size-5 shrink-0 text-primary-ink" />
          <p>
            <span className="font-semibold">Ticket validity: </span>
            valid for one entry per guest on {formatVisitDate(booking.visit_date)}. Park Vega opens {OPEN_DAYS_LONG}, {OPEN_HOURS}.
          </p>
        </div>
      </section>

      {paid && (
        <section aria-labelledby="qr-title" className="mt-6">
          <h2 id="qr-title" className="text-lg font-semibold">Your tickets{tickets.length > 0 && ` (${tickets.length})`}</h2>
          {ticketsQuery.isPending ? (
            <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Loading QR codes…
            </p>
          ) : tickets.length > 0 ? (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {tickets.map((ticket) => (
                <TicketQr key={ticket.id} ticket={ticket} />
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              Your QR codes are on the way – they&apos;re also in your WhatsApp confirmation.
            </p>
          )}
        </section>
      )}

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <section className="rounded-3xl border border-border bg-card p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <DoorOpen className="size-5 text-primary-ink" /> Entry instructions
          </h2>
          <ol className="mt-4 grid gap-3 text-sm">
            {ENTRY_STEPS.map((step, index) => (
              <li key={step} className="flex gap-3">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {index + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </section>
        <section className="rounded-3xl border border-border bg-card p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Shirt className="size-5 text-primary-ink" /> What to wear
          </h2>
          <ul className="mt-4 grid gap-2.5 text-sm">
            {WHAT_TO_WEAR.wear.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-primary-ink" /> {item}
              </li>
            ))}
            {WHAT_TO_WEAR.avoid.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <X className="mt-0.5 size-4 shrink-0 text-destructive" /> {item}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="mt-6 rounded-3xl border border-border bg-card p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <MapPin className="size-5 text-primary-ink" /> Getting there
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          ParkVega Street, Ewuru Road, off the Benin–Asaba Expressway, Agbor, Delta State.
        </p>
        <div className="mt-5 flex flex-wrap gap-3 print:hidden">
          <Button asChild>
            <a href={MAPS_URL} target="_blank" rel="noopener noreferrer">
              <Navigation className="size-4" /> Navigate with Google Maps
            </a>
          </Button>
          <Button asChild variant="outline">
            <Link href="/directions-from-benin-asaba-warri-onitsha">Directions by city</Link>
          </Button>
        </div>
      </section>

      <div className="mt-6 flex flex-wrap gap-3 print:hidden">
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="size-4" /> Print tickets
        </Button>
        <WhatsAppButton variant="outline" message={`Hi Park Vega! I have a question about booking ${booking.code}.`}>
          Questions? WhatsApp us
        </WhatsAppButton>
        <Button asChild variant="ghost">
          <Link href="/restaurants">Pre-order food for pickup</Link>
        </Button>
      </div>
    </div>
  );
}
