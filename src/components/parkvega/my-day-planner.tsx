"use client";

import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Check, Trash2, CalendarHeart, CalendarIcon } from "lucide-react";

import { clientFetch } from "@/lib/api.client";
import { isOpenDate } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Attraction, ItineraryItem, VisitorPlan } from "@/types/api";

const FALLBACK_IMAGE = "/photos/slide-tower-tubes.jpg";

/** The park opens at 11:00; stops are spaced 30 minutes apart, last at 17:30. */
const FIRST_SLOT_MINUTES = 11 * 60;
const SLOT_MINUTES = 30;
const LAST_SLOT_MINUTES = 17 * 60 + 30;

/** HH:MM start time for the stop at `index`. */
function slotTime(index: number): string {
  const minutes = Math.min(
    FIRST_SLOT_MINUTES + index * SLOT_MINUTES,
    LAST_SLOT_MINUTES,
  );
  const hh = String(Math.floor(minutes / 60)).padStart(2, "0");
  const mm = String(minutes % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

function toISODateString(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

function parseISODateString(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/** Today or the next day the park is open. */
function nextOpenDate(extraOpenDates: readonly string[]): string {
  const date = new Date();
  for (let i = 0; i < 14; i++) {
    const iso = toISODateString(date);
    if (isOpenDate(iso, extraOpenDates)) return iso;
    date.setDate(date.getDate() + 1);
  }
  return toISODateString(new Date());
}

function attractionIds(items: ItineraryItem[]): string[] {
  return items
    .filter((item) => item.type === "ATTRACTION")
    .map((item) => item.reference_id);
}

/**
 * Personal itinerary planner.
 *
 * Attractions are fetched server-side and passed in as `initialAttractions`
 * (Requirement 10.5). The visitor picks a visit date, and the saved plan for
 * that date (`GET /api/plans?visitDate=`) pre-fills the selection. Saving
 * replaces the plan's attractions with the current selection, each given a
 * start time 30 minutes after the last, through the BFF data proxy
 * (`/api/plans`). A success toast is shown on success and an inline error
 * message on failure.
 */
export function MyDayPlanner({
  initialAttractions,
  extraOpenDates = [],
}: {
  initialAttractions: Attraction[];
  extraOpenDates?: string[];
}) {
  const queryClient = useQueryClient();
  const [visitDate, setVisitDate] = useState(() =>
    nextOpenDate(extraOpenDates),
  );
  const [dateOpen, setDateOpen] = useState(false);
  // Unsaved selections per visit date; a date without one shows the saved plan.
  const [edits, setEdits] = useState<Record<string, string[]>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  // Plans created this session, so a retry after a failed save reuses them.
  const createdPlans = useRef<Record<string, string>>({});

  const today = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);

  const planQuery = useQuery({
    queryKey: ["plan", visitDate],
    // The API answers 404 when there is no plan for the date yet.
    queryFn: () =>
      clientFetch<ItineraryItem[]>(
        `/api/plans?visitDate=${visitDate}`,
      ).catch(() => [] as ItineraryItem[]),
  });
  const savedItems = useMemo(() => planQuery.data ?? [], [planQuery.data]);

  const itineraryIds = useMemo(
    () => edits[visitDate] ?? attractionIds(savedItems),
    [edits, visitDate, savedItems],
  );

  const inItinerary = useMemo(
    () => new Set(itineraryIds),
    [itineraryIds],
  );

  const itinerary = useMemo(
    () =>
      itineraryIds
        .map((id) => initialAttractions.find((a) => a.id === id))
        .filter((a): a is Attraction => Boolean(a)),
    [itineraryIds, initialAttractions],
  );

  function setItineraryIds(update: (ids: string[]) => string[]) {
    setEdits((all) => ({ ...all, [visitDate]: update(itineraryIds) }));
  }

  function addAttraction(id: string) {
    setItineraryIds((ids) => (ids.includes(id) ? ids : [...ids, id]));
  }

  function removeAttraction(id: string) {
    setItineraryIds((ids) => ids.filter((existing) => existing !== id));
  }

  const saveMutation = useMutation<
    ItineraryItem[],
    Error,
    { date: string; ids: string[]; existing: ItineraryItem[] }
  >({
    mutationFn: async ({ date, ids, existing }) => {
      let planId = existing[0]?.plan_id ?? createdPlans.current[date];
      if (!planId) {
        const plan = await clientFetch<VisitorPlan>("/api/plans", {
          method: "POST",
          body: JSON.stringify({ visitDate: date }),
        });
        planId = plan.id;
        createdPlans.current[date] = planId;
      }

      // Add the new stops before removing the old ones, so a failure part
      // way through never leaves the plan empty.
      let items = existing;
      for (const [index, id] of ids.entries()) {
        items = await clientFetch<ItineraryItem[]>(
          `/api/plans/${planId}/items`,
          {
            method: "POST",
            body: JSON.stringify({
              type: "ATTRACTION",
              referenceId: id,
              startTime: slotTime(index),
            }),
          },
        );
      }
      for (const item of existing.filter((i) => i.type === "ATTRACTION")) {
        items = await clientFetch<ItineraryItem[]>(
          `/api/plans/${planId}/items/${item.id}`,
          { method: "DELETE" },
        );
      }
      return items;
    },
    onSuccess: (items, { date }) => {
      queryClient.setQueryData(["plan", date], items);
      setEdits((all) => {
        const rest = { ...all };
        delete rest[date];
        return rest;
      });
      toast.success("Your day plan has been saved.");
    },
    onError: (_error, { date }) => {
      // Some stops may have been written; reload what the API now holds.
      void queryClient.invalidateQueries({ queryKey: ["plan", date] });
    },
  });

  async function handleSave() {
    setSaveError(null);
    try {
      await saveMutation.mutateAsync({
        date: visitDate,
        ids: itineraryIds,
        existing: savedItems,
      });
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.",
      );
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      {/* --- Attraction catalogue --- */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Choose your attractions</h2>
        {initialAttractions.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-card p-6 text-sm text-muted-foreground">
            No attractions are available to plan right now. Please check back
            soon.
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {initialAttractions.map((attraction) => {
              const added = inItinerary.has(attraction.id);
              return (
                <li key={attraction.id}>
                  <Card className="overflow-hidden py-0">
                    <div className="relative aspect-[4/3] w-full">
                      <Image
                        src={attraction.image_url || FALLBACK_IMAGE}
                        alt={attraction.name}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover"
                      />
                    </div>
                    <CardContent className="space-y-3 p-4">
                      <div>
                        <p className="text-xs font-extrabold uppercase text-primary-ink">
                          {attraction.category}
                        </p>
                        <h3 className="mt-1 font-semibold">{attraction.name}</h3>
                      </div>
                      <Button
                        type="button"
                        variant={added ? "primary" : "outline"}
                        size="sm"
                        className="w-full"
                        onClick={() =>
                          added
                            ? removeAttraction(attraction.id)
                            : addAttraction(attraction.id)
                        }
                        aria-pressed={added}
                      >
                        {added ? (
                          <>
                            <Check className="size-4" aria-hidden="true" /> Added
                          </>
                        ) : (
                          <>
                            <Plus className="size-4" aria-hidden="true" /> Add to
                            my day
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* --- Itinerary summary --- */}
      <aside className="lg:sticky lg:top-10 lg:h-fit">
        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center gap-2">
              <CalendarHeart className="size-5 text-primary-ink" aria-hidden="true" />
              <h2 className="text-lg font-semibold">Your day</h2>
            </div>

            <Popover open={dateOpen} onOpenChange={setDateOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start"
                  aria-label="Change visit date"
                >
                  <CalendarIcon className="size-4" aria-hidden="true" />
                  {format(parseISODateString(visitDate), "EEEE, d MMMM yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={parseISODateString(visitDate)}
                  onSelect={(date) => {
                    if (!date) return;
                    setVisitDate(toISODateString(date));
                    setSaveError(null);
                    setDateOpen(false);
                  }}
                  disabled={[
                    { before: today },
                    (date) =>
                      !isOpenDate(toISODateString(date), extraOpenDates),
                  ]}
                />
              </PopoverContent>
            </Popover>

            {planQuery.isPending ? (
              <p className="text-sm text-muted-foreground">
                Loading your plan&hellip;
              </p>
            ) : itinerary.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Add attractions to build your personal itinerary.
              </p>
            ) : (
              <ul className="space-y-2">
                {itinerary.map((attraction, index) => (
                  <li
                    key={attraction.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2"
                  >
                    <span className="truncate text-sm font-medium">
                      <span className="mr-2 tabular-nums text-muted-foreground">
                        {slotTime(index)}
                      </span>
                      {attraction.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeAttraction(attraction.id)}
                      className="text-muted-foreground transition-colors hover:text-destructive"
                      aria-label={`Remove ${attraction.name} from your day`}
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <Button
              type="button"
              className="w-full"
              onClick={handleSave}
              disabled={
                itinerary.length === 0 ||
                planQuery.isPending ||
                saveMutation.isPending
              }
            >
              {saveMutation.isPending ? "Saving\u2026" : "Save my day"}
            </Button>

            {saveError ? (
              <p className="text-sm font-medium text-destructive" role="alert">
                {saveError}
              </p>
            ) : null}
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
