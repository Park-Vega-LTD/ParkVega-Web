import Link from "next/link";
import { CloudOff } from "lucide-react";

/**
 * Shown in place of a detail page whose data could not be loaded while
 * `next build` pre-rendered it. ISR regenerates the page on a later request,
 * so visitors only see this until the API answers again.
 */
export function ContentUnavailable({
  title,
  backHref,
  backLabel,
}: {
  title: string;
  backHref: string;
  backLabel: string;
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
      <div className="rounded-3xl border border-border bg-card p-10 text-center shadow-lg">
        <CloudOff className="mx-auto size-10 text-primary-ink" />
        <h1 className="mt-5 text-2xl font-semibold">{title}</h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
          We couldn&apos;t load this page just now. Please try again in a minute.
        </p>
        <Link
          href={backHref}
          className="mt-6 inline-block text-sm font-semibold text-primary-ink underline-offset-4 hover:underline"
        >
          {backLabel}
        </Link>
      </div>
    </section>
  );
}
