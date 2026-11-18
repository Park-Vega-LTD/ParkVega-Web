import type { ReactNode } from "react";

import { ScrollReveal } from "@/components/parkvega/scroll-reveal";
import { SiteChrome } from "@/components/parkvega/site-chrome";
import { getSiteSettings } from "@/lib/public-data";
import { shortDays } from "@/lib/site";

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const settings = await getSiteSettings();
  return (
    <SiteChrome
      info={{
        days: shortDays(settings.opening_days),
        hours: settings.opening_hours,
        notice: settings.notice,
        chat: Boolean(process.env.OPENAI_API_KEY),
      }}
    >
      <ScrollReveal />
      {children}
    </SiteChrome>
  );
}
