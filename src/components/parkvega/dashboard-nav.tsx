"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarHeart, Ticket, UserCog } from "lucide-react";

import { Logo } from "@/components/parkvega/logo";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "My Bookings", href: "/my-bookings", icon: Ticket },
  { label: "My Day", href: "/my-day", icon: CalendarHeart },
  { label: "Account", href: "/account", icon: UserCog },
] as const;

export function DashboardNav() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <aside className="lg:w-64 lg:shrink-0">
      <Link
        href="/"
        className="mb-6 hidden items-center gap-2 lg:flex"
        aria-label="Park Vega Waterpark home"
      >
        <Logo size="sm" />
      </Link>

      <nav
        aria-label="Dashboard navigation"
        className="flex gap-2 overflow-x-auto rounded-2xl border border-border bg-card p-2 lg:flex-col lg:overflow-visible"
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground/70 hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
