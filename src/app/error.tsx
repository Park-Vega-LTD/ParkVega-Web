"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Intentionally do not render `error.message` or stack traces to the browser.
  // Internal error details are not exposed to the user. `error` is referenced
  // only so the boundary receives the standard props contract.
  void error;

  return (
    <main className="flex min-h-full flex-1 flex-col items-center justify-center bg-muted px-4 py-16 text-center">
      <div className="w-full max-w-md">
        <p className="text-sm font-bold uppercase tracking-widest text-destructive">
          Something went wrong
        </p>
        <h1 className="mt-3 text-3xl font-bold text-foreground sm:text-4xl">
          We hit an unexpected wave
        </h1>
        <p className="mt-4 text-base text-muted-foreground">
          An unexpected error occurred while loading this page. Please try again
          in a moment.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button size="lg" onClick={() => reset()}>
            Try again
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/">Back to home</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
