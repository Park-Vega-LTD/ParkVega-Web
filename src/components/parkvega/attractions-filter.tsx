"use client";

import { useState } from "react";

import { AttractionCard } from "@/components/parkvega/attraction-card";
import { Button } from "@/components/ui/button";
import type { Attraction } from "@/types/api";

const CATEGORIES = ["All", "Thrill", "Family", "Kids", "Relax"] as const;

type Category = (typeof CATEGORIES)[number];

export function AttractionsFilter({ attractions }: { attractions: Attraction[] }) {
  const [selected, setSelected] = useState<Category>("All");

  const visible =
    selected === "All"
      ? attractions
      : attractions.filter(
          (attraction) =>
            attraction.category.toLowerCase() === selected.toLowerCase(),
        );

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((category) => (
          <Button
            key={category}
            variant={selected === category ? "primary" : "outline"}
            onClick={() => setSelected(category)}
          >
            {category}
          </Button>
        ))}
      </div>

      {visible.length > 0 ? (
        <div className="mt-9 grid gap-5 md:grid-cols-3">
          {visible.map((attraction) => (
            <AttractionCard key={attraction.id} attraction={attraction} />
          ))}
        </div>
      ) : (
        <p className="mt-9 text-center text-muted-foreground">
          No attractions in this category
        </p>
      )}
    </div>
  );
}
