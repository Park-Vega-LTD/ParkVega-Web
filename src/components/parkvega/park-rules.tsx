import {
  Armchair,
  Ban,
  Beer,
  Cigarette,
  Crosshair,
  Drone,
  Fuel,
  Gem,
  Milk,
  PawPrint,
  Pill,
  Sandwich,
  ShieldCheck,
  Slice,
  SprayCan,
  Wine,
  Zap,
  type LucideIcon,
} from "lucide-react";

import { PARK_RULES, PROHIBITED_ITEMS } from "@/lib/home-content";
import { cn } from "@/lib/utils";

const ITEM_ICONS: Record<(typeof PROHIBITED_ITEMS)[number]["icon"], LucideIcon> = {
  food: Sandwich,
  alcohol: Beer,
  glass: Wine,
  bottle: Milk,
  chair: Armchair,
  drone: Drone,
  drugs: Pill,
  gun: Crosshair,
  knife: Slice,
  pet: PawPrint,
  jewellery: Gem,
  smoking: Cigarette,
  spray: SprayCan,
  tank: Fuel,
  taser: Zap,
};

/** The official park rules as a numbered, scannable grid. */
export function ParkRulesList({ className }: { className?: string }) {
  return (
    <ol className={cn("grid gap-3 sm:grid-cols-2", className)}>
      {PARK_RULES.map((rule, index) => (
        <li key={rule} className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 text-sm">
          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-ocean-soft text-xs font-bold text-primary-ink">
            {index + 1}
          </span>
          <span className="pt-1">{rule}</span>
        </li>
      ))}
    </ol>
  );
}

/**
 * Prohibited items as a consistent icon grid with plain-language labels
 * (brand guide §7), replacing the old icon-only modal.
 */
export function ProhibitedItemsGrid({ className }: { className?: string }) {
  return (
    <div className={className}>
      <p className="flex items-start gap-2 text-sm text-muted-foreground">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary-ink" aria-hidden="true" />
        For everyone&apos;s safety, these aren&apos;t allowed in the park. Please leave them at home or in your car.
      </p>
      <ul className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-5">
        {PROHIBITED_ITEMS.map(({ label, icon }) => {
          const Icon = ITEM_ICONS[icon];
          return (
            <li key={label} className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card px-2 py-4 text-center">
              <span className="relative grid size-12 place-items-center rounded-full bg-muted text-foreground">
                <Icon className="size-6" aria-hidden="true" />
                <Ban className="absolute -right-1 -top-1 size-5 rounded-full bg-card text-destructive" aria-hidden="true" />
              </span>
              <span className="text-xs font-semibold leading-tight sm:text-sm">{label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
