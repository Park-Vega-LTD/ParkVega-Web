"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { Plus, Check, Trash2, CalendarHeart } from "lucide-react";

import { clientFetch } from "@/lib/api.client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Attraction } from "@/types/api";

const FALLBACK_IMAGE = "/parkvega-hero.jpg";

/**
 * Personal itinerary planner.
 *
 * Attractions are fetched server-side and passed in as `initialAttractions`
 * (Requirement 10.5). Users add/remove attractions from their itinerary via
 * local state; saving persists the itinerary through the BFF data proxy
 * (`/api/itinerary`). A success toast is shown on success and an inline error
 * message on failure.
 */
export function MyDayPlanner({
  initialAttractions,
}: {
  initialAttractions: Attraction[];
}) {
  const [itineraryIds, setItineraryIds] = useState<string[]>([]);
  const [saveError, setSaveError] = useState<string | null>(null);

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

  function addAttraction(id: string) {
    setItineraryIds((ids) => (ids.includes(id) ? ids : [...ids, id]));
  }

  function removeAttraction(id: string) {
    setItineraryIds((ids) => ids.filter((existing) => existing !== id));
  }

  const saveMutation = useMutation<unknown, Error, string[]>({
    mutationFn: (ids) =>
      clientFetch("/api/itinerary", {
        method: "POST",
        body: JSON.stringify({ attraction_ids: ids }),
      }),
    onSuccess: () => {
      toast.success("Your day plan has been saved.");
    },
  });

  async function handleSave() {
    setSaveError(null);
    try {
      await saveMutation.mutateAsync(itineraryIds);
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

            {itinerary.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Add attractions to build your personal itinerary.
              </p>
            ) : (
              <ul className="space-y-2">
                {itinerary.map((attraction) => (
                  <li
                    key={attraction.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2"
                  >
                    <span className="truncate text-sm font-medium">
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
              disabled={itinerary.length === 0 || saveMutation.isPending}
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
