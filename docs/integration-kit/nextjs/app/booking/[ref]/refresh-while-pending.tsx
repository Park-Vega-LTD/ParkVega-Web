'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Re-renders the current Server Component page every `intervalMs`, up to
 * `maxTries` times. Keep it gentle: guest booking lookups are limited to
 * 30 a minute per visitor.
 */
export function RefreshWhilePending({
  intervalMs = 4000,
  maxTries = 15,
}: {
  intervalMs?: number;
  maxTries?: number;
}) {
  const router = useRouter();
  const [tries, setTries] = useState(0);

  useEffect(() => {
    if (tries >= maxTries) return;
    const id = setTimeout(() => {
      router.refresh();
      setTries((n) => n + 1);
    }, intervalMs);
    return () => clearTimeout(id);
  }, [tries, maxTries, intervalMs, router]);

  if (tries < maxTries) return null;
  return (
    <p>
      Still waiting on the payment provider. You can close this page: we&apos;ll
      send your tickets on WhatsApp once payment is confirmed.
    </p>
  );
}
