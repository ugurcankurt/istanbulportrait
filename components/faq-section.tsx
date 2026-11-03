"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FAQSectionProps {
  header?: React.ReactNode;
  dynamicFaqs?: any[] | null;
}

export function FAQSection({ header, dynamicFaqs }: FAQSectionProps) {
  if (!dynamicFaqs || dynamicFaqs.length === 0) {
    return null; // Return nothing if no dynamic FAQs are configured yet
  }

  return (
    <section className="py-8 sm:py-10 bg-gradient-to-b from-muted/20 to-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {header}

        <div className="mx-auto">
          <Accordion className="w-full bg-transparent">
            {dynamicFaqs.map((faq) => (
              <AccordionItem key={faq.id} value={faq.id}>
                <AccordionTrigger className="text-left hover:text-primary transition-colors py-4 sm:py-5">
                  <span className="font-serif font-normal text-base sm:text-lg lg:text-xl text-foreground text-left tracking-tight">
                    {faq.question}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground font-light text-sm sm:text-base leading-relaxed pb-4 sm:pb-6">
                  <p>{faq.answer}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
