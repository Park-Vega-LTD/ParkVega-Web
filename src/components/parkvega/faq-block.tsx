import { FaqAccordion } from "@/components/parkvega/faq-accordion";
import { JsonLd } from "@/components/parkvega/json-ld";
import { SectionHeading } from "@/components/parkvega/page-hero";
import { WhatsAppButton } from "@/components/parkvega/whatsapp-button";
import { getFaqs } from "@/lib/public-data";
import { faqPageSchema } from "@/lib/schema";
import { cn } from "@/lib/utils";
import type { FAQ } from "@/types/api";

export type FaqPair = [question: string, answer: string];

/**
 * The mini FAQ block that appears on every major page (brief §4), with its
 * FAQPage schema. Page-specific questions come first, followed by the shared
 * staff-managed FAQs, de-duplicated and capped so the block stays short.
 */
export async function FaqBlock({
  extra = [],
  limit = 8,
  title = "Frequently asked questions.",
  className,
}: {
  extra?: FaqPair[];
  limit?: number;
  title?: string;
  className?: string;
}) {
  const shared = await getFaqs();
  const specific: FAQ[] = extra.map(([question, answer], index) => ({
    id: `page-faq-${index}`,
    question,
    answer,
    sort_order: index,
  }));
  const seen = new Set<string>();
  const faqs = [...specific, ...shared]
    .filter((faq) => {
      const key = faq.question.trim().toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit);

  return (
    <section className={cn("bg-ocean-soft/50 py-16 sm:py-20", className)}>
      <JsonLd data={faqPageSchema(faqs)} />
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <SectionHeading
            eyebrow="Good to know"
            title={title}
            description="Still unsure? Our team answers on WhatsApp during opening hours."
          />
          <div className="mt-6">
            <WhatsAppButton>Chat on WhatsApp</WhatsAppButton>
          </div>
        </div>
        <FaqAccordion faqs={faqs} />
      </div>
    </section>
  );
}
