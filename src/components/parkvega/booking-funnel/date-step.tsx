"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { isOpenDate } from "@/lib/site";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Step 1 of the booking funnel — visit date selection.
 *
 * Uses the shadcn `Calendar` wrapper around `react-day-picker` in single-date
 * mode. On "Continue" it emits the selected date to the orchestrator as a
 * `YYYY-MM-DD` string (Requirement 6.1).
 *
 * The component is controlled by the funnel via `initialDate` so that
 * navigating back to step 1 restores the previously chosen date.
 */
interface DateStepProps {
  /** Previously-selected visit date as `YYYY-MM-DD`, or null if none. */
  initialDate: string | null;
  /** Staff-managed Mon–Wed holiday openings (site settings + holiday events). */
  extraOpenDates?: string[];
  /** Called with the selected date as a `YYYY-MM-DD` string. */
  onNext: (date: string) => void;
}

/** Format a Date as a local `YYYY-MM-DD` string (no timezone shift). */
function toISODateString(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

/** Parse a `YYYY-MM-DD` string into a local Date, or undefined if absent. */
function parseISODateString(value: string | null): Date | undefined {
  if (!value) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day);
}

export function DateStep({ initialDate, extraOpenDates, onNext }: DateStepProps) {
  const [selected, setSelected] = React.useState<Date | undefined>(() =>
    parseISODateString(initialDate),
  );

  // Disable dates before today so visitors cannot book a past date.
  const today = React.useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);

  function handleContinue() {
    if (!selected) return;
    onNext(toISODateString(selected));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-2xl">Choose your visit date</CardTitle>
        <CardDescription>
          Pick the day you&apos;d like to splash. Tickets are valid on
          Thursdays, Fridays, Saturdays, Sundays and public holidays.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={setSelected}
            disabled={[{ before: today }, (date) => !isOpenDate(toISODateString(date), extraOpenDates)]}
            className="rounded-md border"
          />

          <div
            className={cn(
              "flex items-center gap-2 rounded-md border bg-muted/40 px-4 py-3 text-sm",
              selected ? "text-foreground" : "text-muted-foreground",
            )}
          >
            <CalendarIcon className="size-4" aria-hidden="true" />
            <span>
              {selected
                ? format(selected, "EEEE, d MMMM yyyy")
                : "No date selected yet"}
            </span>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="button" onClick={handleContinue} disabled={!selected}>
            Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
