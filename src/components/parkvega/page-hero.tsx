import { Fragment, type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Ticket } from "lucide-react";

import { Button } from "@/components/ui/button";

export function PageHero({
  eyebrow,
  title,
  description,
  image,
  imageAlt,
  ticketCta = true,
}: {
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  ticketCta?: boolean;
}) {
  return (
    <section className="px-3 py-3 sm:px-6 sm:py-5">
      <div className="relative mx-auto min-h-[460px] max-w-7xl overflow-hidden rounded-3xl bg-foreground">
        <Image
          src={image}
          alt={imageAlt}
          fill
          sizes="100vw"
          preload
          className="absolute inset-0 size-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/95 via-foreground/60 to-transparent" />
        <div className="relative flex min-h-[460px] max-w-2xl flex-col justify-end p-6 pb-12 sm:p-12">
          <span data-reveal className="text-xs font-extrabold uppercase text-secondary">{eyebrow}</span>
          <h1 data-reveal="words" className="mt-3 text-balance text-[2.25rem] font-bold leading-tight text-hero-foreground sm:text-5xl">
            {title.split(" ").map((word, i) => (
              <Fragment key={i}>
                {i > 0 && " "}
                <span style={{ "--w": i } as CSSProperties}>{word}</span>
              </Fragment>
            ))}
          </h1>
          <p data-reveal style={{ "--i": 3 } as CSSProperties} className="mt-5 max-w-xl text-base leading-relaxed text-hero-foreground/80 sm:text-lg">{description}</p>
          <div data-reveal style={{ "--i": 4 } as CSSProperties} className="mt-7 flex flex-wrap gap-3">
            {ticketCta && (
              <Button asChild variant="ticket">
                <Link href="/tickets">
                  <Ticket className="size-4" /> Buy Tickets
                </Link>
              </Button>
            )}
            <Button asChild variant="glass">
              <Link href="/plan-your-visit">
                Plan your visit <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div>
      <span data-reveal className="block text-sm font-bold uppercase tracking-wide text-primary-ink">
        {eyebrow}
      </span>
      {/* Word-by-word reveal; the spans are inline-block so the heading still wraps and reads normally. */}
      <h2 data-reveal="words" className="mt-2 max-w-3xl text-balance text-[1.75rem] font-bold leading-tight sm:text-4xl">
        {title.split(" ").map((word, i) => (
          <Fragment key={i}>
            {i > 0 && " "}
            <span style={{ "--w": i } as CSSProperties}>{word}</span>
          </Fragment>
        ))}
      </h2>
      {description && (
        <p
          data-reveal
          style={{ "--i": 3 } as CSSProperties}
          className="mt-3 max-w-2xl text-lg leading-relaxed text-muted-foreground"
        >
          {description}
        </p>
      )}
    </div>
  );
}
