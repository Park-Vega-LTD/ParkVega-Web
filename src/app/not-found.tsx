import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Page not found | Park Vega",
  description: "The page you are looking for could not be found.",
};

export default function NotFound() {
  return (
    <main className="flex min-h-full flex-1 flex-col items-center justify-center bg-muted px-4 py-16 text-center">
      <div className="w-full max-w-md">
        <p className="text-sm font-bold uppercase tracking-widest text-primary-ink">
          404
        </p>
        <h1 className="mt-3 text-3xl font-bold text-foreground sm:text-4xl">
          We couldn&apos;t find that page
        </h1>
        <p className="mt-4 text-base text-muted-foreground">
          The page you&apos;re looking for may have moved, or it never made a
          splash here. Let&apos;s get you back to dry land.
        </p>
        <div className="mt-8 flex justify-center">
          <Button asChild size="lg">
            <Link href="/">Back to home</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
