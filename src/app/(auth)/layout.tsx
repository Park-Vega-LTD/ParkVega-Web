import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarCheck, QrCode, Ticket, UtensilsCrossed } from "lucide-react";

import { Logo } from "@/components/parkvega/logo";

const PERKS = [
  { icon: Ticket, title: "Book in minutes", text: "Pick a date, pay online and skip the gate queue." },
  { icon: QrCode, title: "Tickets on your phone", text: "Your digital tickets are always one tap away." },
  { icon: UtensilsCrossed, title: "Order food ahead", text: "Line up meals and drinks for your day at the park." },
  { icon: CalendarCheck, title: "Manage every visit", text: "See upcoming bookings and past visits in one place." },
];

/**
 * Shared frame for login and register: a Deep Ocean brand panel beside the
 * form on large screens, and a compact logo above the form on small ones.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="grid min-h-full flex-1 bg-muted lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="relative hidden overflow-hidden bg-deep text-hero-foreground lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
        {/* Decorative water glow and waves. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute -left-32 -top-32 size-[28rem] rounded-full bg-primary/30 blur-3xl" />
          <div className="absolute -right-24 top-1/3 size-80 rounded-full bg-secondary/20 blur-3xl" />
          <svg
            viewBox="0 0 1440 320"
            preserveAspectRatio="none"
            className="absolute inset-x-0 bottom-0 h-56 w-full text-primary/25"
          >
            <path
              fill="currentColor"
              d="M0 192l60-16c60-16 180-48 300-42.7S600 192 720 213.3s240 21.4 360-5.3 240-80 300-106.7l60-26.6V320H0z"
            />
            <path
              fill="currentColor"
              d="M0 256l48-10.7C96 235 192 213 288 208s192 5 288 26.7S768 288 864 282.7 1056 235 1152 213.3s192-21.3 240-21.3h48V320H0z"
            />
          </svg>
        </div>

        <Link href="/" className="relative w-fit rounded-lg" aria-label="Park Vega Waterpark home">
          <Logo tone="onDark" size="md" />
        </Link>

        <div className="relative max-w-md space-y-8">
          <div className="space-y-3">
            <h2 className="font-display text-4xl font-bold leading-tight xl:text-5xl">
              Your splash day <span className="text-primary">starts here.</span>
            </h2>
            <p className="text-lg text-hero-foreground/80">
              One account for tickets, food orders and everything you plan at Park Vega.
            </p>
          </div>

          <ul className="space-y-5">
            {PERKS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex items-start gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-hero-foreground/10 text-primary ring-1 ring-hero-foreground/15">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <span>
                  <span className="block font-bold">{title}</span>
                  <span className="block text-sm text-hero-foreground/75">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-sm text-hero-foreground/70">
          Agbor, Delta State · Open Thursday to Sunday and public holidays
        </p>
      </aside>

      <div className="flex flex-col items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-6 flex items-center justify-between">
            <Link href="/" className="rounded-lg lg:hidden" aria-label="Park Vega Waterpark home">
              <Logo size="sm" />
            </Link>
            <Link
              href="/"
              className="ml-auto inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back to site
            </Link>
          </div>

          <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)] sm:p-8">
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}
