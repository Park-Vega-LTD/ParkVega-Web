import { Star } from "lucide-react";

import { REVIEWS } from "@/lib/home-content";

/** Google review quotes, shared by the homepage and landing pages. */
export function ReviewsGrid() {
  return (
    <div className="grid gap-5 md:grid-cols-3">
      {REVIEWS.map(({ quote, author }) => (
        <figure key={author} className="flex flex-col rounded-3xl border border-border bg-card p-6">
          <div className="flex gap-0.5 text-accent" aria-label="5 out of 5 stars">
            {Array.from({ length: 5 }, (_, i) => (
              <Star key={i} className="size-4 fill-current" />
            ))}
          </div>
          <blockquote className="mt-4 flex-1 text-sm leading-relaxed">“{quote}”</blockquote>
          <figcaption className="mt-5 text-sm font-bold">{author}</figcaption>
        </figure>
      ))}
    </div>
  );
}
