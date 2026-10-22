"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { FAQ } from "@/types/api";

/**
 * Client island for the homepage FAQ section.
 *
 * The homepage is a Server Component (ISR), but the expand/collapse state of the
 * FAQ accordion is interactive, so it lives in this small `"use client"` island
 * built on the shadcn/ui Accordion (Radix) which owns the open/closed state.
 */
export function FaqAccordion({ faqs }: { faqs: FAQ[] }) {
  if (faqs.length === 0) {
    return (
      <p className="text-sm leading-relaxed text-muted-foreground">
        Current visitor guidance is available in Plan Your Visit. The Park Vega
        team can also help with questions specific to your group.
      </p>
    );
  }

  return (
    <Accordion type="single" collapsible defaultValue={faqs[0]?.id} className="w-full">
      {faqs.map((faq) => (
        <AccordionItem key={faq.id} value={faq.id}>
          <AccordionTrigger className="py-5 text-base font-bold">
            {faq.question}
          </AccordionTrigger>
          <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
            {faq.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
